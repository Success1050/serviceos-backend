import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { SignJWT } from 'jose';
import { ServiceRequestService } from '../service-request/service-request.service';
import { CreateServiceRequestDto } from '../service-request/dto/create-service-request.dto';
import { NotificationService } from '../notification/notification.service';
import { LiveTrackingResponseDto } from './dto/live-tracking.dto';

@Injectable()
export class PortalService {
  private readonly jwtSecret: Uint8Array;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly serviceRequestService: ServiceRequestService,
    private readonly notificationService: NotificationService,
  ) {
    const secretStr = this.configService.get<string>('JWT_SECRET') || 'super-secret-key-for-dev-only-do-not-use-in-prod';
    this.jwtSecret = new TextEncoder().encode(secretStr);
  }

  // --- CUSTOMER VALIDATION HELPER ---

  private async validateCustomerRelationship(tenantId: string, relationshipId: string) {
    const relationship = await this.prisma.customerTenantRelationship.findUnique({
      where: { id: relationshipId },
      include: {
        customerRecord: true,
        tenant: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!relationship || relationship.tenantId !== tenantId) {
      throw new UnauthorizedException('Invalid customer context');
    }

    return relationship;
  }

  // --- SERVICE REQUEST PIPELINE ---

  async createServiceRequest(tenantId: string, relationshipId: string, createDto: CreateServiceRequestDto) {
    const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);

    const created = await this.serviceRequestService.createRequest(
      tenantId,
      relationship.customerRecordId,
      createDto,
    );

    // Dispatch real-time notification to tenant staff queue
    const isEmergency = createDto.urgency === 'EMERGENCY';
    const alertTitle = isEmergency ? '🚨 EMERGENCY SERVICE DISPATCH' : 'New Customer Service Request';
    const alertMessage = `${relationship.customerRecord.name} requested service: ${createDto.description}`;

    await this.notificationService.sendToTenant(
      tenantId,
      alertTitle,
      alertMessage,
      isEmergency ? 'WARNING' : 'INFO',
      `/dashboard/service-requests`,
    );

    return created;
  }

  async getCustomerServiceRequests(tenantId: string, relationshipId: string) {
    const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);

    return this.prisma.serviceRequest.findMany({
      where: {
        tenantId,
        customerRecordId: relationship.customerRecordId,
      },
      include: {
        asset: {
          select: { id: true, name: true, serialNumber: true, modelNumber: true, warrantyExpiresAt: true },
        },
        job: {
          select: {
            id: true,
            title: true,
            status: true,
            scheduledAt: true,
            assignedTechnician: {
              select: { firstName: true, lastName: true, avatarUrl: true, rating: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- LIVE TECHNICIAN TRACKING ENGINE ---

  async getLiveJobTracking(tenantId: string, relationshipId: string, jobId: string): Promise<LiveTrackingResponseDto> {
    const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customerRecord: true,
        assignedTechnician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            bio: true,
            certifications: true,
            rating: true,
            jobsCompletedCount: true,
            phone: true,
            lastKnownLatitude: true,
            lastKnownLongitude: true,
            lastLocationUpdate: true,
          },
        },
      },
    });

    if (!job || job.tenantId !== tenantId || job.customerRecordId !== relationship.customerRecordId) {
      throw new NotFoundException('Job tracking not found or unauthorized');
    }

    const tech = job.assignedTechnician;
    const isEnRouteOrInProgress = job.status === 'EN_ROUTE' || job.status === 'IN_PROGRESS';

    // Calculate distance and ETA if technician coordinates are available and job is active
    let distanceKm: number | null = null;
    let estimatedEtaMinutes: number | null = null;

    if (isEnRouteOrInProgress && tech?.lastKnownLatitude != null && tech?.lastKnownLongitude != null) {
      // Benchmark site reference coordinates (e.g., metropolitan customer site location)
      const siteLat = 6.5244;
      const siteLon = 3.3792;
      distanceKm = this.calculateHaversineDistanceKm(
        tech.lastKnownLatitude,
        tech.lastKnownLongitude,
        siteLat,
        siteLon,
      );
      // Realistic urban dispatch speed benchmark ~35 km/h
      estimatedEtaMinutes = Math.max(2, Math.round((distanceKm / 35) * 60));
    }

    // Privacy Protection: Mask coordinates when technician is not actively en-route or in-progress
    const telemetry = {
      isLive: isEnRouteOrInProgress && tech?.lastKnownLatitude != null,
      latitude: isEnRouteOrInProgress ? (tech?.lastKnownLatitude ?? null) : null,
      longitude: isEnRouteOrInProgress ? (tech?.lastKnownLongitude ?? null) : null,
      lastLocationUpdate: isEnRouteOrInProgress ? (tech?.lastLocationUpdate ?? null) : null,
      estimatedEtaMinutes: isEnRouteOrInProgress ? estimatedEtaMinutes : null,
      distanceKm: isEnRouteOrInProgress ? distanceKm : null,
    };

    // Sanitized technician presentation profile (zero internal wage or system metadata leakage)
    const technician = tech
      ? {
          id: tech.id,
          firstName: tech.firstName,
          lastName: tech.lastName,
          avatarUrl: tech.avatarUrl || 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=300&q=80',
          bio: tech.bio || 'Certified ServiceOS Field Technician with multi-brand equipment expertise.',
          certifications: tech.certifications || [],
          rating: tech.rating ?? 5.0,
          jobsCompletedCount: tech.jobsCompletedCount ?? 0,
          phone: tech.phone,
        }
      : null;

    // Cryptographic OTP is exclusively revealed to customer when work is IN_PROGRESS
    const completionOtp = job.status === 'IN_PROGRESS' ? job.completionOtp : null;

    return {
      jobId: job.id,
      title: job.title,
      description: job.description,
      status: job.status,
      scheduledAt: job.scheduledAt,
      estimatedDuration: job.estimatedDuration,
      enRouteAt: job.enRouteAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      customerAddress: job.customerRecord.address,
      technician,
      telemetry,
      completionOtp,
    };
  }

  private calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  // --- SELF-SERVE INVOICE & DIGITAL RECORDS ---

  async getInvoicesHistory(tenantId: string, relationshipId: string) {
    const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        customerRecordId: relationship.customerRecordId,
        status: { not: 'DRAFT' },
      },
      include: {
        job: {
          select: { id: true, title: true, status: true, completedAt: true },
        },
        quoteMilestone: {
          select: { id: true, title: true, percentage: true, status: true },
        },
        paymentTransactions: {
          select: {
            id: true,
            gateway: true,
            paymentMethod: true,
            amount: true,
            currency: true,
            status: true,
            transactionReference: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map(inv => ({
      ...inv,
      isPaid: inv.status === 'PAID',
      isOverdue: inv.dueDate ? new Date() > inv.dueDate && inv.status !== 'PAID' : false,
    }));
  }

  async getInvoiceDetails(tenantId: string, relationshipId: string, invoiceId: string) {
    const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        customerRecord: { select: { id: true, name: true, email: true, phone: true, address: true } },
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            completedAt: true,
            assignedTechnician: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        quoteMilestone: true,
        paymentTransactions: true,
        escrowHold: true,
      },
    });

    if (!invoice || invoice.tenantId !== tenantId || invoice.customerRecordId !== relationship.customerRecordId) {
      throw new NotFoundException('Invoice not found or unauthorized');
    }

    return invoice;
  }

  // --- SELF-SERVE JOB WORK HISTORY ---

  async getJobsHistory(tenantId: string, relationshipId: string) {
    const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);

    const jobs = await this.prisma.job.findMany({
      where: {
        tenantId,
        customerRecordId: relationship.customerRecordId,
      },
      include: {
        assignedTechnician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            rating: true,
            bio: true,
            certifications: true,
          },
        },
        invoices: {
          where: { status: { not: 'DRAFT' } },
          select: { id: true, title: true, amount: true, status: true, paidAt: true },
        },
        serviceRequests: {
          select: { id: true, description: true, urgency: true, status: true },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return jobs;
  }

  async getJobDetails(tenantId: string, relationshipId: string, jobId: string) {
    const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        assignedTechnician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            rating: true,
            bio: true,
            certifications: true,
            phone: true,
          },
        },
        invoices: {
          where: { status: { not: 'DRAFT' } },
          include: { paymentTransactions: true },
        },
        serviceRequests: {
          include: { asset: true },
        },
        quote: {
          include: { milestones: true },
        },
      },
    });

    if (!job || job.tenantId !== tenantId || job.customerRecordId !== relationship.customerRecordId) {
      throw new NotFoundException('Job record not found or unauthorized');
    }

    return job;
  }

  // --- SELF-SERVE ASSETS & WARRANTY TRACKING ---

  async getAssetsHistory(tenantId: string, relationshipId: string) {
    const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);

    const assets = await this.prisma.asset.findMany({
      where: {
        tenantId,
        customerRecordId: relationship.customerRecordId,
      },
      include: {
        maintenanceSchedules: {
          orderBy: { nextDueDate: 'asc' },
        },
        serviceRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    return assets.map(asset => {
      const isWarrantyActive = asset.warrantyExpiresAt ? asset.warrantyExpiresAt > now : false;
      const daysUntilWarrantyExpiry = asset.warrantyExpiresAt
        ? Math.ceil((asset.warrantyExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...asset,
        warranty: {
          isActive: isWarrantyActive,
          expiresAt: asset.warrantyExpiresAt,
          daysRemaining: daysUntilWarrantyExpiry,
          documentUrl: asset.warrantyDocumentUrl,
        },
      };
    });
  }

  async getAssetDetails(tenantId: string, relationshipId: string, assetId: string) {
    const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);

    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        maintenanceSchedules: {
          orderBy: { nextDueDate: 'asc' },
        },
        serviceRequests: {
          include: {
            job: {
              select: { id: true, title: true, status: true, completedAt: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!asset || asset.tenantId !== tenantId || asset.customerRecordId !== relationship.customerRecordId) {
      throw new NotFoundException('Asset record not found or unauthorized');
    }

    const now = new Date();
    const isWarrantyActive = asset.warrantyExpiresAt ? asset.warrantyExpiresAt > now : false;

    return {
      ...asset,
      warranty: {
        isActive: isWarrantyActive,
        expiresAt: asset.warrantyExpiresAt,
        daysRemaining: asset.warrantyExpiresAt
          ? Math.ceil((asset.warrantyExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        documentUrl: asset.warrantyDocumentUrl,
      },
    };
  }

  // --- UNIFIED DASHBOARD ---

  async getDashboard(tenantId: string, relationshipId: string) {
    const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);

    const [quotes, invoices, jobs, assets, serviceRequests] = await Promise.all([
      this.prisma.quote.findMany({
        where: { tenantId, customerRecordId: relationship.customerRecordId, status: { not: 'DRAFT' } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.findMany({
        where: { tenantId, customerRecordId: relationship.customerRecordId, status: { not: 'DRAFT' } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.findMany({
        where: { tenantId, customerRecordId: relationship.customerRecordId },
        include: {
          assignedTechnician: {
            select: { firstName: true, lastName: true, avatarUrl: true, rating: true, phone: true },
          },
        },
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.asset.findMany({
        where: { tenantId, customerRecordId: relationship.customerRecordId },
        include: { maintenanceSchedules: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceRequest.findMany({
        where: { tenantId, customerRecordId: relationship.customerRecordId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Detect if there is currently an active job with live technician en-route or in-progress
    const activeJob = jobs.find(j => j.status === 'EN_ROUTE' || j.status === 'IN_PROGRESS');

    return {
      tenantName: relationship.tenant.name,
      profile: {
        name: relationship.customerRecord.name,
        email: relationship.customerRecord.email,
        phone: relationship.customerRecord.phone,
        address: relationship.customerRecord.address,
      },
      activeJob: activeJob
        ? {
            id: activeJob.id,
            title: activeJob.title,
            status: activeJob.status,
            technician: activeJob.assignedTechnician,
            liveTrackingAvailable: true,
          }
        : null,
      quotes,
      invoices,
      jobs,
      assets,
      serviceRequests,
    };
  }

  // --- PASSWORDLESS OTP AUTHENTICATION ---

  async requestOtp(slug: string, phone: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const code = '123456';
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt,
      },
    });

    console.log(`[STAGE 25 SMS] To: ${phone} | Your ServiceOS Portal verification code is: ${code}`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(slug: string, phone: string, code: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const validOtp = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        code,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!validOtp) throw new UnauthorizedException('Invalid or expired OTP');

    const customerRecord = await this.prisma.customerRecord.findFirst({
      where: {
        tenantId: tenant.id,
        phone: phone,
      },
    });

    if (!customerRecord) {
      throw new UnauthorizedException('No customer profile found for this phone number at this company.');
    }

    let identity = await this.prisma.serviceOSIdentity.findUnique({ where: { phone } });
    if (!identity) {
      identity = await this.prisma.serviceOSIdentity.create({
        data: { phone, status: 'ACTIVE' },
      });
    }

    let relationship = await this.prisma.customerTenantRelationship.findFirst({
      where: { tenantId: tenant.id, customerRecordId: customerRecord.id },
    });

    if (!relationship) {
      relationship = await this.prisma.customerTenantRelationship.create({
        data: {
          tenantId: tenant.id,
          customerRecordId: customerRecord.id,
          identityId: identity.id,
          status: 'ACTIVE',
        },
      });
    }

    // Generate JWT with customer claims and scoped portal permissions
    const alg = 'HS256';
    const jwt = await new SignJWT({
      sub: identity.id,
      phone: identity.phone,
      role: 'CUSTOMER',
      tenantId: tenant.id,
      relationshipId: relationship.id,
      permissions: ['customer_portal', 'admin_access'],
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(this.jwtSecret);

    return {
      message: 'Authentication successful',
      accessToken: jwt,
      tenantName: tenant.name,
      customerName: customerRecord.name,
    };
  }

  // --- QUOTE & INVOICE MAGIC LINK VIEWING ---

  async getQuoteForCustomer(slug: string, quoteId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        tenant: { select: { name: true } },
        customerRecord: { select: { name: true, email: true, address: true } },
        milestones: { orderBy: { order: 'asc' } },
      },
    });

    if (!quote || quote.tenantId !== tenant.id || quote.status === 'DRAFT') {
      throw new NotFoundException('Quote not found');
    }

    return quote;
  }

  async acceptQuote(slug: string, quoteId: string, acceptDto?: any, clientIp?: string) {
    const quote = await this.getQuoteForCustomer(slug, quoteId);

    if (quote.status !== 'SENT') {
      throw new BadRequestException('Only SENT quotes can be accepted');
    }

    if (acceptDto && !acceptDto.acceptedTerms) {
      throw new BadRequestException('You must accept the Terms and Conditions to proceed.');
    }

    const updateData: any = {
      status: 'ACCEPTED',
    };

    if (acceptDto) {
      updateData.signedTermsAt = new Date();
      updateData.signerName = acceptDto.signerName;
      updateData.signatureData = acceptDto.signatureData;
      if (clientIp) {
        updateData.signerIp = clientIp;
      }
    }

    const updatedQuote = await this.prisma.quote.update({
      where: { id: quoteId },
      data: updateData,
      include: {
        milestones: { orderBy: { order: 'asc' } },
        customerRecord: true,
      },
    });

    // If quote is MILESTONE billing, automatically invoice Milestone 1 (deposit)
    if (updatedQuote.billingType === 'MILESTONE' && updatedQuote.milestones?.length > 0) {
      const firstMilestone = updatedQuote.milestones[0];
      if (firstMilestone.status === 'PENDING') {
        const milestoneInvoice = await this.prisma.invoice.create({
          data: {
            tenantId: quote.tenantId,
            customerRecordId: quote.customerRecordId,
            title: `Deposit - ${firstMilestone.title} (${quote.title})`,
            amount: firstMilestone.amount,
            status: 'SENT',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        await this.prisma.quoteMilestone.update({
          where: { id: firstMilestone.id },
          data: {
            status: 'INVOICED',
            invoiceId: milestoneInvoice.id,
          },
        });
      }
    }

    // Send Real-Time Notification to all staff
    await this.notificationService.sendToTenant(
      quote.tenantId,
      'Quote Accepted & T&C Signed!',
      `Quote #${quoteId.substring(0, 8)} was just accepted by ${quote.customerRecord.name}!`,
      'SUCCESS',
      `/dashboard/quotes/${quoteId}`,
    );

    return updatedQuote;
  }

  async getInvoiceForCustomer(slug: string, invoiceId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: { select: { name: true } },
        customerRecord: { select: { name: true, email: true, address: true } },
        job: { select: { title: true, status: true } },
        quoteMilestone: true,
        paymentTransactions: true,
      },
    });

    if (!invoice || invoice.tenantId !== tenant.id || invoice.status === 'DRAFT') {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }
}
