"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const config_1 = require("@nestjs/config");
const jose_1 = require("jose");
const service_request_service_1 = require("../service-request/service-request.service");
const notification_service_1 = require("../notification/notification.service");
const support_ticket_service_1 = require("../support-ticket/support-ticket.service");
let PortalService = class PortalService {
    prisma;
    configService;
    serviceRequestService;
    notificationService;
    supportTicketService;
    jwtSecret;
    constructor(prisma, configService, serviceRequestService, notificationService, supportTicketService) {
        this.prisma = prisma;
        this.configService = configService;
        this.serviceRequestService = serviceRequestService;
        this.notificationService = notificationService;
        this.supportTicketService = supportTicketService;
        const secretStr = this.configService.get('JWT_SECRET') || 'super-secret-key-for-dev-only-do-not-use-in-prod';
        this.jwtSecret = new TextEncoder().encode(secretStr);
    }
    async validateCustomerRelationship(tenantId, relationshipId) {
        const relationship = await this.prisma.customerTenantRelationship.findUnique({
            where: { id: relationshipId },
            include: {
                customerRecord: true,
                tenant: { select: { id: true, name: true, slug: true } },
            },
        });
        if (!relationship || relationship.tenantId !== tenantId) {
            throw new common_1.UnauthorizedException('Invalid customer context');
        }
        return relationship;
    }
    async createServiceRequest(tenantId, relationshipId, createDto) {
        const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);
        const created = await this.serviceRequestService.createRequest(tenantId, relationship.customerRecordId, createDto);
        const isEmergency = createDto.urgency === 'EMERGENCY';
        const alertTitle = isEmergency ? '🚨 EMERGENCY SERVICE DISPATCH' : 'New Customer Service Request';
        const alertMessage = `${relationship.customerRecord.name} requested service: ${createDto.description}`;
        await this.notificationService.sendToTenant(tenantId, alertTitle, alertMessage, isEmergency ? 'WARNING' : 'INFO', `/dashboard/service-requests`);
        return created;
    }
    async getCustomerServiceRequests(tenantId, relationshipId) {
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
    async getLiveJobTracking(tenantId, relationshipId, jobId) {
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
            throw new common_1.NotFoundException('Job tracking not found or unauthorized');
        }
        const tech = job.assignedTechnician;
        const isEnRouteOrInProgress = job.status === 'EN_ROUTE' || job.status === 'IN_PROGRESS';
        let distanceKm = null;
        let estimatedEtaMinutes = null;
        if (isEnRouteOrInProgress && tech?.lastKnownLatitude != null && tech?.lastKnownLongitude != null) {
            const siteLat = 6.5244;
            const siteLon = 3.3792;
            distanceKm = this.calculateHaversineDistanceKm(tech.lastKnownLatitude, tech.lastKnownLongitude, siteLat, siteLon);
            estimatedEtaMinutes = Math.max(2, Math.round((distanceKm / 35) * 60));
        }
        const telemetry = {
            isLive: isEnRouteOrInProgress && tech?.lastKnownLatitude != null,
            latitude: isEnRouteOrInProgress ? (tech?.lastKnownLatitude ?? null) : null,
            longitude: isEnRouteOrInProgress ? (tech?.lastKnownLongitude ?? null) : null,
            lastLocationUpdate: isEnRouteOrInProgress ? (tech?.lastLocationUpdate ?? null) : null,
            estimatedEtaMinutes: isEnRouteOrInProgress ? estimatedEtaMinutes : null,
            distanceKm: isEnRouteOrInProgress ? distanceKm : null,
        };
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
    calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10) / 10;
    }
    async getInvoicesHistory(tenantId, relationshipId) {
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
    async getInvoiceDetails(tenantId, relationshipId, invoiceId) {
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
            throw new common_1.NotFoundException('Invoice not found or unauthorized');
        }
        return invoice;
    }
    async getJobsHistory(tenantId, relationshipId) {
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
    async getJobDetails(tenantId, relationshipId, jobId) {
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
            throw new common_1.NotFoundException('Job record not found or unauthorized');
        }
        return job;
    }
    async getAssetsHistory(tenantId, relationshipId) {
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
    async getAssetDetails(tenantId, relationshipId, assetId) {
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
            throw new common_1.NotFoundException('Asset record not found or unauthorized');
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
    async getDashboard(tenantId, relationshipId) {
        const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);
        const [quotes, invoices, jobs, assets, serviceRequests, supportTickets] = await Promise.all([
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
            this.prisma.supportTicket.findMany({
                where: { tenantId, customerRecordId: relationship.customerRecordId },
                include: {
                    asset: { select: { id: true, name: true, serialNumber: true } },
                    invoice: { select: { id: true, title: true, amount: true, status: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
        ]);
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
            supportTickets,
        };
    }
    async requestOtp(slug, phone) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        const code = '123456';
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
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
    async verifyOtp(slug, phone, code) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        const validOtp = await this.prisma.otpCode.findFirst({
            where: {
                phone,
                code,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!validOtp)
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        const customerRecord = await this.prisma.customerRecord.findFirst({
            where: {
                tenantId: tenant.id,
                phone: phone,
            },
        });
        if (!customerRecord) {
            throw new common_1.UnauthorizedException('No customer profile found for this phone number at this company.');
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
        const alg = 'HS256';
        const jwt = await new jose_1.SignJWT({
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
    async getQuoteForCustomer(slug, quoteId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
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
            throw new common_1.NotFoundException('Quote not found');
        }
        return quote;
    }
    async acceptQuote(slug, quoteId, acceptDto, clientIp) {
        const quote = await this.getQuoteForCustomer(slug, quoteId);
        if (quote.status !== 'SENT') {
            throw new common_1.BadRequestException('Only SENT quotes can be accepted');
        }
        if (acceptDto && !acceptDto.acceptedTerms) {
            throw new common_1.BadRequestException('You must accept the Terms and Conditions to proceed.');
        }
        const updateData = {
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
        await this.notificationService.sendToTenant(quote.tenantId, 'Quote Accepted & T&C Signed!', `Quote #${quoteId.substring(0, 8)} was just accepted by ${quote.customerRecord.name}!`, 'SUCCESS', `/dashboard/quotes/${quoteId}`);
        return updatedQuote;
    }
    async getInvoiceForCustomer(slug, invoiceId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
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
            throw new common_1.NotFoundException('Invoice not found');
        }
        return invoice;
    }
    async createSupportTicket(tenantId, relationshipId, createDto) {
        const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);
        return this.supportTicketService.createCustomerTicket(tenantId, relationship.customerRecordId, createDto, relationship.customerRecord.name);
    }
    async getCustomerSupportTickets(tenantId, relationshipId) {
        const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);
        return this.supportTicketService.getCustomerTickets(tenantId, relationship.customerRecordId);
    }
    async getSupportTicketDetails(tenantId, relationshipId, ticketId) {
        const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);
        return this.supportTicketService.getTicketDetails(tenantId, ticketId, true, relationship.customerRecordId);
    }
    async postTicketMessage(tenantId, relationshipId, ticketId, createMessageDto) {
        const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);
        return this.supportTicketService.addMessage(tenantId, ticketId, {
            senderType: 'CUSTOMER',
            senderCustomerRecordId: relationship.customerRecordId,
            senderName: relationship.customerRecord.name,
        }, createMessageDto);
    }
    async closeCustomerTicket(tenantId, relationshipId, ticketId) {
        const relationship = await this.validateCustomerRelationship(tenantId, relationshipId);
        const ticket = await this.supportTicketService.getTicketDetails(tenantId, ticketId, true, relationship.customerRecordId);
        if (ticket.status === 'CLOSED') {
            throw new common_1.BadRequestException('Ticket is already closed');
        }
        await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                status: 'CLOSED',
                closedAt: new Date(),
            },
        });
        await this.prisma.supportTicketMessage.create({
            data: {
                ticketId,
                senderType: 'SYSTEM',
                senderName: 'Customer Portal',
                message: `Ticket closed by customer (${relationship.customerRecord.name}).`,
            },
        });
        await this.notificationService.sendToTenant(tenantId, `Support Ticket Closed #${ticket.ticketNumber}`, `Customer ${relationship.customerRecord.name} marked Ticket #${ticket.ticketNumber} as resolved and closed.`, 'INFO', `/dashboard/support-tickets/${ticket.id}`);
        return { message: 'Ticket closed successfully', ticketId };
    }
};
exports.PortalService = PortalService;
exports.PortalService = PortalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        service_request_service_1.ServiceRequestService,
        notification_service_1.NotificationService,
        support_ticket_service_1.SupportTicketService])
], PortalService);
//# sourceMappingURL=portal.service.js.map