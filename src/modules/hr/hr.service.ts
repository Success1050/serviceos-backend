import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateOverTheDeskTechDto } from './dto/create-over-the-desk-tech.dto';
import { UploadHrDocumentDto } from './dto/upload-hr-document.dto';
import { ReviewProxyVerificationDto } from './dto/review-proxy-verification.dto';
import { FilterTechniciansDto } from './dto/filter-technicians.dto';
import { AcknowledgeTermsDto } from './dto/acknowledge-terms.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class HrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Over-the-desk technician onboarding without requiring email.
   * Handles Sub-Company proxy verification requirements vs HQ direct hires.
   */
  async createOverTheDeskTech(currentUser: any, dto: CreateOverTheDeskTechDto) {
    if (!currentUser.tenantId) {
      throw new BadRequestException('User does not belong to a tenant');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: currentUser.tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const cleanedPhone = dto.phone.trim().replace(/[\s\-\(\)]/g, '');

    // Check if user with this phone already exists in this tenant or globally
    const existing = await this.prisma.user.findFirst({
      where: { phone: cleanedPhone },
    });
    if (existing) {
      throw new ConflictException(`A user with phone number ${cleanedPhone} already exists`);
    }

    const isSubCompany = !!tenant.parentId;
    const initialStatus = isSubCompany ? 'PENDING_APPROVAL' : 'ACTIVE';
    const proxyStatus = isSubCompany ? 'PENDING_HQ_REVIEW' : 'NOT_REQUIRED';

    // Generate secure shadow email for database constraint integrity
    const safePhone = cleanedPhone.replace(/[^0-9]/g, '');
    const shadowEmail = `tech_${safePhone}@${tenant.slug}.serviceos.local`;

    // Dummy password hash since technician logs in via 4-digit SMS OTP
    const dummyHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

    const commissionRate = dto.customCommissionRate !== undefined ? dto.customCommissionRate : 15.00;

    const tech = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: cleanedPhone,
        email: shadowEmail,
        passwordHash: dummyHash,
        tenantId: tenant.id,
        departmentId: dto.departmentId || null,
        isFieldTech: true,
        tradeSpecialty: dto.tradeSpecialty || 'Field Technician',
        customCommissionRate: commissionRate,
        hourlyRate: dto.hourlyRate ?? null,
        status: initialStatus,
        proxyVerificationStatus: proxyStatus,
        managerEndorsementNotes: dto.managerEndorsementNotes || 'Physical over-the-desk verification conducted by Branch Manager.',
        managerVerifiedAt: new Date(),
        managerVerifiedById: currentUser.id,
      },
    });

    // Ingest attached HR documents (e.g. ID photo, live face photo, certifications)
    if (dto.documents && dto.documents.length > 0) {
      await this.prisma.hrDocument.createMany({
        data: dto.documents.map((doc) => ({
          tenantId: tenant.id,
          userId: tech.id,
          documentType: (doc.documentType as any) || 'GOVERNMENT_PHOTO_ID',
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          fileSizeBytes: doc.fileSizeBytes || null,
          mimeType: doc.mimeType || null,
          notes: doc.notes || null,
          uploadedById: currentUser.id,
        })),
      });
    }

    // Create immutable audit log
    await this.prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: currentUser.id,
        action: 'OVER_THE_DESK_TECH_CREATED',
        entityType: 'User',
        entityId: tech.id,
        details: {
          technicianName: `${dto.firstName} ${dto.lastName}`,
          phone: cleanedPhone,
          tradeSpecialty: dto.tradeSpecialty,
          customCommissionRate: commissionRate,
          proxyVerificationStatus: proxyStatus,
          isSubCompany,
          documentsUploaded: dto.documents?.length || 0,
        },
      },
    });

    // Real-time notification to Corporate HQ if pending proxy verification
    if (isSubCompany && tenant.parentId) {
      await this.notificationService.sendToTenant(
        tenant.parentId,
        'New Technician Pending Proxy Verification',
        `Branch "${tenant.name}" submitted technician ${dto.firstName} ${dto.lastName} for HQ proxy verification.`,
        'URGENT',
        `/hr/hq/verifications/${tech.id}`,
      );
    }

    // Dispatch SMS notification simulation
    console.log(`[STAGE 27 SMS] To: ${cleanedPhone} | Welcome to ServiceOS, ${dto.firstName}! Your technician profile has been created at ${tenant.name}.`);

    return this.getTechnicianDossier(currentUser, tech.id);
  }

  /**
   * Uploads an HR document (ID photo, live face selfie, certificate, CV) to technician file.
   */
  async uploadHrDocument(currentUser: any, techId: string, dto: UploadHrDocumentDto) {
    if (!currentUser.tenantId) throw new BadRequestException('User does not belong to a tenant');

    const tech = await this.prisma.user.findUnique({
      where: { id: techId },
    });

    if (!tech || tech.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('Technician not found in your tenant');
    }

    const document = await this.prisma.hrDocument.create({
      data: {
        tenantId: currentUser.tenantId,
        userId: tech.id,
        documentType: dto.documentType,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileSizeBytes: dto.fileSizeBytes || null,
        mimeType: dto.mimeType || null,
        notes: dto.notes || null,
        uploadedById: currentUser.id,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: currentUser.tenantId,
        userId: currentUser.id,
        action: 'HR_DOCUMENT_UPLOADED',
        entityType: 'HrDocument',
        entityId: document.id,
        details: {
          technicianId: techId,
          documentType: dto.documentType,
          fileName: dto.fileName,
        },
      },
    });

    return document;
  }

  /**
   * Retrieves full technician dossier including digital HR documents and verification audit trail.
   */
  async getTechnicianDossier(currentUser: any, techId: string) {
    const tech = await this.prisma.user.findUnique({
      where: { id: techId },
      include: {
        tenant: { select: { id: true, name: true, slug: true, parentId: true } },
        department: { select: { id: true, name: true } },
        hrDocuments: {
          include: {
            uploadedBy: { select: { id: true, firstName: true, lastName: true } },
            verifiedBy: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        managerVerifiedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        hqReviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!tech) throw new NotFoundException('Technician not found');

    // Scoping: Same tenant OR Parent HQ tenant
    const isSameTenant = tech.tenantId === currentUser.tenantId;
    const isParentHq = tech.tenant?.parentId === currentUser.tenantId;

    if (!isSameTenant && !isParentHq) {
      throw new ForbiddenException('You do not have permission to view this technician dossier');
    }

    const { passwordHash: _, ...safeTech } = tech;
    return safeTech;
  }

  /**
   * Lists branch technicians with search, status filters, and pagination.
   */
  async listBranchTechnicians(currentUser: any, filter: FilterTechniciansDto) {
    if (!currentUser.tenantId) throw new BadRequestException('User does not belong to a tenant');

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: currentUser.tenantId,
      isFieldTech: true,
    };

    if (filter.proxyVerificationStatus) {
      where.proxyVerificationStatus = filter.proxyVerificationStatus;
    }

    if (filter.termsAcknowledged !== undefined) {
      where.termsAcknowledged = filter.termsAcknowledged;
    }

    if (filter.departmentId) {
      where.departmentId = filter.departmentId;
    }

    if (filter.search) {
      where.OR = [
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search } },
        { tradeSpecialty: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [total, technicians] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true } },
          hrDocuments: {
            select: { id: true, documentType: true, fileName: true, fileUrl: true },
          },
          managerVerifiedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const sanitized = technicians.map(({ passwordHash: _, ...rest }) => rest);

    return {
      data: sanitized,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Corporate HQ God-View: Lists all pending proxy verifications across all franchisee branches.
   */
  async getPendingProxyVerifications(currentUser: any) {
    if (!currentUser.tenantId) throw new BadRequestException('User does not belong to a tenant');

    // Find all sub-companies of current user's tenant
    const subCompanies = await this.prisma.tenant.findMany({
      where: { parentId: currentUser.tenantId },
      select: { id: true },
    });

    const subCompanyIds = subCompanies.map((s) => s.id);

    return this.prisma.user.findMany({
      where: {
        tenantId: { in: subCompanyIds },
        isFieldTech: true,
        proxyVerificationStatus: 'PENDING_HQ_REVIEW',
      },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        department: { select: { id: true, name: true } },
        hrDocuments: true,
        managerVerifiedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Corporate HQ Decision Engine: Approves or Rejects branch technician hire.
   */
  async reviewProxyVerification(currentUser: any, techId: string, dto: ReviewProxyVerificationDto) {
    if (!currentUser.tenantId) throw new BadRequestException('User does not belong to a tenant');

    const tech = await this.prisma.user.findUnique({
      where: { id: techId },
      include: { tenant: true },
    });

    if (!tech) throw new NotFoundException('Technician not found');

    if (tech.tenant?.parentId !== currentUser.tenantId) {
      throw new ForbiddenException('Only the Parent Corporate HQ can review proxy verifications for this branch');
    }

    if (tech.proxyVerificationStatus !== 'PENDING_HQ_REVIEW') {
      throw new BadRequestException(`Technician is not pending review (current status: ${tech.proxyVerificationStatus})`);
    }

    if (dto.approved) {
      const updated = await this.prisma.user.update({
        where: { id: techId },
        data: {
          proxyVerificationStatus: 'APPROVED',
          status: 'ACTIVE',
          hqReviewedAt: new Date(),
          hqReviewedById: currentUser.id,
          hqReviewNotes: dto.notes || 'Corporate HQ approved proxy verification.',
        },
      });

      // Mark all pending HR documents as verified
      await this.prisma.hrDocument.updateMany({
        where: { userId: techId, verifiedAt: null },
        data: {
          verifiedAt: new Date(),
          verifiedById: currentUser.id,
        },
      });

      // Notify Branch Manager
      if (tech.tenantId) {
        await this.notificationService.sendToTenant(
          tech.tenantId,
          'Technician Hire Approved by Corporate HQ',
          `Technician ${tech.firstName} ${tech.lastName} has been verified and activated for field dispatch.`,
          'SUCCESS',
          `/hr/technicians/${tech.id}`,
        );
      }

      // Dispatch Welcome SMS to Technician
      if (tech.phone) {
        console.log(`[STAGE 27 SMS] To: ${tech.phone} | Corporate HQ has approved your profile! Log into your ServiceOS technician app to begin.`);
      }

      // Record in AuditLog
      await this.prisma.auditLog.create({
        data: {
          tenantId: currentUser.tenantId,
          userId: currentUser.id,
          action: 'PROXY_VERIFICATION_APPROVED',
          entityType: 'User',
          entityId: tech.id,
          details: {
            technicianName: `${tech.firstName} ${tech.lastName}`,
            branchId: tech.tenantId,
            reviewNotes: dto.notes,
          },
        },
      });

      const { passwordHash: _, ...safeUpdated } = updated;
      return safeUpdated;
    } else {
      const updated = await this.prisma.user.update({
        where: { id: techId },
        data: {
          proxyVerificationStatus: 'REJECTED',
          status: 'SUSPENDED',
          hqReviewedAt: new Date(),
          hqReviewedById: currentUser.id,
          hqReviewNotes: dto.notes || 'Corporate HQ rejected proxy verification.',
        },
      });

      // Notify Branch Manager of rejection
      if (tech.tenantId) {
        await this.notificationService.sendToTenant(
          tech.tenantId,
          'Technician Hire Rejected by Corporate HQ',
          `Technician ${tech.firstName} ${tech.lastName} proxy verification was rejected: ${dto.notes || 'Missing documentation'}`,
          'WARNING',
          `/hr/technicians/${tech.id}`,
        );
      }

      await this.prisma.auditLog.create({
        data: {
          tenantId: currentUser.tenantId,
          userId: currentUser.id,
          action: 'PROXY_VERIFICATION_REJECTED',
          entityType: 'User',
          entityId: tech.id,
          details: {
            technicianName: `${tech.firstName} ${tech.lastName}`,
            branchId: tech.tenantId,
            rejectionNotes: dto.notes,
          },
        },
      });

      const { passwordHash: _, ...safeUpdated } = updated;
      return safeUpdated;
    }
  }

  /**
   * The "Big Button" Legal Acknowledgment Protocol.
   * Technicians tap "I AGREE" on first login, generating an immutable audit trail of commission agreement.
   */
  async acknowledgeTerms(techUser: any, dto: AcknowledgeTermsDto, ipAddress: string, userAgent: string) {
    const tech = await this.prisma.user.findUnique({
      where: { id: techUser.id },
      include: { tenant: true },
    });

    if (!tech) throw new NotFoundException('Technician profile not found');

    if (tech.termsAcknowledged) {
      return {
        message: 'Commission agreement terms already acknowledged.',
        agreedCommissionRate: tech.agreedCommissionSnapshot || tech.customCommissionRate,
        acknowledgedAt: tech.termsAcknowledgedAt,
      };
    }

    const agreedRate = tech.customCommissionRate || 15.00;
    const now = new Date();

    const updated = await this.prisma.user.update({
      where: { id: tech.id },
      data: {
        termsAcknowledged: true,
        termsAcknowledgedAt: now,
        termsAcknowledgedIp: ipAddress,
        termsAcknowledgedUserAgent: userAgent,
        termsVersion: dto.termsVersion || 'v1.0-2026',
        agreedCommissionSnapshot: agreedRate,
      },
    });

    // Create immutable audit log entry for legal defensibility
    if (tech.tenantId) {
      await this.prisma.auditLog.create({
        data: {
          tenantId: tech.tenantId,
          userId: tech.id,
          action: 'LEGAL_PAYROLL_TERMS_ACCEPTED',
          entityType: 'User',
          entityId: tech.id,
          details: {
            technicianName: `${tech.firstName} ${tech.lastName}`,
            agreedCommissionRate: agreedRate.toString(),
            hourlyRate: tech.hourlyRate?.toString() || null,
            termsVersion: dto.termsVersion || 'v1.0-2026',
            ipAddress,
            userAgent,
            timestamp: now.toISOString(),
          },
        },
      });
    }

    return {
      message: 'Legal commission terms accepted successfully. You are now fully active.',
      agreedCommissionRate: updated.agreedCommissionSnapshot,
      acknowledgedAt: updated.termsAcknowledgedAt,
    };
  }

  /**
   * Returns authenticated technician's compensation terms, rate, and agreement status.
   */
  async getMyCompensation(techUser: any) {
    const tech = await this.prisma.user.findUnique({
      where: { id: techUser.id },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        department: { select: { id: true, name: true } },
      },
    });

    if (!tech) throw new NotFoundException('Technician not found');

    return {
      id: tech.id,
      firstName: tech.firstName,
      lastName: tech.lastName,
      phone: tech.phone,
      tradeSpecialty: tech.tradeSpecialty,
      customCommissionRate: tech.customCommissionRate,
      hourlyRate: tech.hourlyRate,
      termsAcknowledged: tech.termsAcknowledged,
      termsAcknowledgedAt: tech.termsAcknowledgedAt,
      agreedCommissionSnapshot: tech.agreedCommissionSnapshot,
      branchName: tech.tenant?.name,
      departmentName: tech.department?.name,
    };
  }
}
