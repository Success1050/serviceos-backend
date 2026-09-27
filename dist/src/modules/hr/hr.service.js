"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HrService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
let HrService = class HrService {
    prisma;
    notificationService;
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async createOverTheDeskTech(currentUser, dto) {
        if (!currentUser.tenantId) {
            throw new common_1.BadRequestException('User does not belong to a tenant');
        }
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: currentUser.tenantId },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        const cleanedPhone = dto.phone.trim().replace(/[\s\-\(\)]/g, '');
        const existing = await this.prisma.user.findFirst({
            where: { phone: cleanedPhone },
        });
        if (existing) {
            throw new common_1.ConflictException(`A user with phone number ${cleanedPhone} already exists`);
        }
        const isSubCompany = !!tenant.parentId;
        const initialStatus = isSubCompany ? 'PENDING_APPROVAL' : 'ACTIVE';
        const proxyStatus = isSubCompany ? 'PENDING_HQ_REVIEW' : 'NOT_REQUIRED';
        const safePhone = cleanedPhone.replace(/[^0-9]/g, '');
        const shadowEmail = `tech_${safePhone}@${tenant.slug}.serviceos.local`;
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
        if (dto.documents && dto.documents.length > 0) {
            await this.prisma.hrDocument.createMany({
                data: dto.documents.map((doc) => ({
                    tenantId: tenant.id,
                    userId: tech.id,
                    documentType: doc.documentType || 'GOVERNMENT_PHOTO_ID',
                    fileName: doc.fileName,
                    fileUrl: doc.fileUrl,
                    fileSizeBytes: doc.fileSizeBytes || null,
                    mimeType: doc.mimeType || null,
                    notes: doc.notes || null,
                    uploadedById: currentUser.id,
                })),
            });
        }
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
        if (isSubCompany && tenant.parentId) {
            await this.notificationService.sendToTenant(tenant.parentId, 'New Technician Pending Proxy Verification', `Branch "${tenant.name}" submitted technician ${dto.firstName} ${dto.lastName} for HQ proxy verification.`, 'URGENT', `/hr/hq/verifications/${tech.id}`);
        }
        console.log(`[STAGE 27 SMS] To: ${cleanedPhone} | Welcome to ServiceOS, ${dto.firstName}! Your technician profile has been created at ${tenant.name}.`);
        return this.getTechnicianDossier(currentUser, tech.id);
    }
    async uploadHrDocument(currentUser, techId, dto) {
        if (!currentUser.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        const tech = await this.prisma.user.findUnique({
            where: { id: techId },
        });
        if (!tech || tech.tenantId !== currentUser.tenantId) {
            throw new common_1.NotFoundException('Technician not found in your tenant');
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
    async getTechnicianDossier(currentUser, techId) {
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
        if (!tech)
            throw new common_1.NotFoundException('Technician not found');
        const isSameTenant = tech.tenantId === currentUser.tenantId;
        const isParentHq = tech.tenant?.parentId === currentUser.tenantId;
        if (!isSameTenant && !isParentHq) {
            throw new common_1.ForbiddenException('You do not have permission to view this technician dossier');
        }
        const { passwordHash: _, ...safeTech } = tech;
        return safeTech;
    }
    async listBranchTechnicians(currentUser, filter) {
        if (!currentUser.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        const page = filter.page || 1;
        const limit = filter.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
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
    async getPendingProxyVerifications(currentUser) {
        if (!currentUser.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
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
    async reviewProxyVerification(currentUser, techId, dto) {
        if (!currentUser.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        const tech = await this.prisma.user.findUnique({
            where: { id: techId },
            include: { tenant: true },
        });
        if (!tech)
            throw new common_1.NotFoundException('Technician not found');
        if (tech.tenant?.parentId !== currentUser.tenantId) {
            throw new common_1.ForbiddenException('Only the Parent Corporate HQ can review proxy verifications for this branch');
        }
        if (tech.proxyVerificationStatus !== 'PENDING_HQ_REVIEW') {
            throw new common_1.BadRequestException(`Technician is not pending review (current status: ${tech.proxyVerificationStatus})`);
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
            await this.prisma.hrDocument.updateMany({
                where: { userId: techId, verifiedAt: null },
                data: {
                    verifiedAt: new Date(),
                    verifiedById: currentUser.id,
                },
            });
            if (tech.tenantId) {
                await this.notificationService.sendToTenant(tech.tenantId, 'Technician Hire Approved by Corporate HQ', `Technician ${tech.firstName} ${tech.lastName} has been verified and activated for field dispatch.`, 'SUCCESS', `/hr/technicians/${tech.id}`);
            }
            if (tech.phone) {
                console.log(`[STAGE 27 SMS] To: ${tech.phone} | Corporate HQ has approved your profile! Log into your ServiceOS technician app to begin.`);
            }
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
        }
        else {
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
            if (tech.tenantId) {
                await this.notificationService.sendToTenant(tech.tenantId, 'Technician Hire Rejected by Corporate HQ', `Technician ${tech.firstName} ${tech.lastName} proxy verification was rejected: ${dto.notes || 'Missing documentation'}`, 'WARNING', `/hr/technicians/${tech.id}`);
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
    async acknowledgeTerms(techUser, dto, ipAddress, userAgent) {
        const tech = await this.prisma.user.findUnique({
            where: { id: techUser.id },
            include: { tenant: true },
        });
        if (!tech)
            throw new common_1.NotFoundException('Technician profile not found');
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
    async getMyCompensation(techUser) {
        const tech = await this.prisma.user.findUnique({
            where: { id: techUser.id },
            include: {
                tenant: { select: { id: true, name: true, slug: true } },
                department: { select: { id: true, name: true } },
            },
        });
        if (!tech)
            throw new common_1.NotFoundException('Technician not found');
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
};
exports.HrService = HrService;
exports.HrService = HrService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], HrService);
//# sourceMappingURL=hr.service.js.map