import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { SignJWT } from 'jose';
import { ServiceRequestService } from '../service-request/service-request.service';
import { CreateServiceRequestDto } from '../service-request/dto/create-service-request.dto';
import { NotificationService } from '../notification/notification.service';

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

  async createServiceRequest(tenantId: string, relationshipId: string, createDto: CreateServiceRequestDto) {
    const relationship = await this.prisma.customerTenantRelationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship || relationship.tenantId !== tenantId) {
      throw new UnauthorizedException('Invalid relationship');
    }

    return this.serviceRequestService.createRequest(tenantId, relationship.customerRecordId, createDto);
  }

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
        tenant: {
          select: { name: true }
        },
        customerRecord: {
          select: { name: true, email: true, address: true }
        }
      }
    });

    if (!quote || quote.tenantId !== tenant.id) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.status === 'DRAFT') {
      throw new NotFoundException('Quote not found');
    }

    return quote;
  }

  async acceptQuote(slug: string, quoteId: string) {
    const quote = await this.getQuoteForCustomer(slug, quoteId);

    if (quote.status !== 'SENT') {
      throw new BadRequestException('Only SENT quotes can be accepted');
    }

    const updatedQuote = await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' },
    });

    // Send Real-Time Notification to all staff
    await this.notificationService.sendToTenant(
      quote.tenantId,
      'Quote Accepted!',
      `Quote #${quoteId.substring(0, 8)} was just accepted by ${quote.customerRecord.name}!`,
      'SUCCESS',
      `/dashboard/quotes/${quoteId}`
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
        tenant: {
          select: { name: true }
        },
        customerRecord: {
          select: { name: true, email: true, address: true }
        }
      }
    });

    if (!invoice || invoice.tenantId !== tenant.id) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'DRAFT') {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  // --- NEW: OTP & DASHBOARD LOGIC ---

  async requestOtp(slug: string, phone: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    // In a real app, generate a random 6-digit code. Here we simulate '123456' for simplicity.
    const code = '123456';
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt,
      }
    });

    // Simulate sending SMS
    console.log(`[SIMULATED SMS] To: ${phone} | Your ServiceOS Portal code is: ${code}`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(slug: string, phone: string, code: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    // Find valid OTP
    const validOtp = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        code,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!validOtp) throw new UnauthorizedException('Invalid or expired OTP');

    // OTP is valid. Now check if the user exists as a customer for this tenant
    // Find a CustomerRecord that matches the phone
    const customerRecord = await this.prisma.customerRecord.findFirst({
      where: {
        tenantId: tenant.id,
        phone: phone,
      }
    });

    if (!customerRecord) {
      throw new UnauthorizedException('No customer profile found for this phone number at this company.');
    }

    // Ensure Identity and Relationship exist
    let identity = await this.prisma.serviceOSIdentity.findUnique({ where: { phone } });
    if (!identity) {
      identity = await this.prisma.serviceOSIdentity.create({
        data: { phone, status: 'ACTIVE' }
      });
    }

    let relationship = await this.prisma.customerTenantRelationship.findFirst({
      where: { tenantId: tenant.id, customerRecordId: customerRecord.id }
    });

    if (!relationship) {
      relationship = await this.prisma.customerTenantRelationship.create({
        data: {
          tenantId: tenant.id,
          customerRecordId: customerRecord.id,
          identityId: identity.id,
          status: 'ACTIVE'
        }
      });
    }

    // Generate JWT
    const alg = 'HS256';
    const jwt = await new SignJWT({ 
      sub: identity.id, 
      phone: identity.phone, 
      role: 'CUSTOMER', 
      tenantId: tenant.id,
      relationshipId: relationship.id 
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(this.jwtSecret);

    return {
      message: 'Authentication successful',
      accessToken: jwt,
      tenantName: tenant.name
    };
  }

  async getDashboard(tenantId: string, relationshipId: string) {
    const relationship = await this.prisma.customerTenantRelationship.findUnique({
      where: { id: relationshipId },
      include: {
        customerRecord: {
          include: {
            quotes: {
              where: { status: { not: 'DRAFT' } },
              orderBy: { createdAt: 'desc' }
            },
            invoices: {
              where: { status: { not: 'DRAFT' } },
              orderBy: { createdAt: 'desc' }
            },
            jobs: {
              orderBy: { createdAt: 'desc' }
            },
            assets: {
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        tenant: {
          select: { name: true }
        }
      }
    });

    if (!relationship || relationship.tenantId !== tenantId) {
      throw new UnauthorizedException('Invalid relationship');
    }

    return {
      tenantName: relationship.tenant.name,
      profile: {
        name: relationship.customerRecord.name,
        email: relationship.customerRecord.email,
        phone: relationship.customerRecord.phone,
        address: relationship.customerRecord.address,
      },
      quotes: relationship.customerRecord.quotes,
      invoices: relationship.customerRecord.invoices,
      jobs: relationship.customerRecord.jobs,
      assets: relationship.customerRecord.assets,
    };
  }
}
