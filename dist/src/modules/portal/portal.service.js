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
let PortalService = class PortalService {
    prisma;
    configService;
    serviceRequestService;
    notificationService;
    jwtSecret;
    constructor(prisma, configService, serviceRequestService, notificationService) {
        this.prisma = prisma;
        this.configService = configService;
        this.serviceRequestService = serviceRequestService;
        this.notificationService = notificationService;
        const secretStr = this.configService.get('JWT_SECRET') || 'super-secret-key-for-dev-only-do-not-use-in-prod';
        this.jwtSecret = new TextEncoder().encode(secretStr);
    }
    async createServiceRequest(tenantId, relationshipId, createDto) {
        const relationship = await this.prisma.customerTenantRelationship.findUnique({
            where: { id: relationshipId },
        });
        if (!relationship || relationship.tenantId !== tenantId) {
            throw new common_1.UnauthorizedException('Invalid relationship');
        }
        return this.serviceRequestService.createRequest(tenantId, relationship.customerRecordId, createDto);
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
                tenant: {
                    select: { name: true }
                },
                customerRecord: {
                    select: { name: true, email: true, address: true }
                }
            }
        });
        if (!quote || quote.tenantId !== tenant.id) {
            throw new common_1.NotFoundException('Quote not found');
        }
        if (quote.status === 'DRAFT') {
            throw new common_1.NotFoundException('Quote not found');
        }
        return quote;
    }
    async acceptQuote(slug, quoteId) {
        const quote = await this.getQuoteForCustomer(slug, quoteId);
        if (quote.status !== 'SENT') {
            throw new common_1.BadRequestException('Only SENT quotes can be accepted');
        }
        const updatedQuote = await this.prisma.quote.update({
            where: { id: quoteId },
            data: { status: 'ACCEPTED' },
        });
        await this.notificationService.sendToTenant(quote.tenantId, 'Quote Accepted!', `Quote #${quoteId.substring(0, 8)} was just accepted by ${quote.customerRecord.name}!`, 'SUCCESS', `/dashboard/quotes/${quoteId}`);
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
                tenant: {
                    select: { name: true }
                },
                customerRecord: {
                    select: { name: true, email: true, address: true }
                }
            }
        });
        if (!invoice || invoice.tenantId !== tenant.id) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        if (invoice.status === 'DRAFT') {
            throw new common_1.NotFoundException('Invoice not found');
        }
        return invoice;
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
            }
        });
        console.log(`[SIMULATED SMS] To: ${phone} | Your ServiceOS Portal code is: ${code}`);
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
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });
        if (!validOtp)
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        const customerRecord = await this.prisma.customerRecord.findFirst({
            where: {
                tenantId: tenant.id,
                phone: phone,
            }
        });
        if (!customerRecord) {
            throw new common_1.UnauthorizedException('No customer profile found for this phone number at this company.');
        }
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
        const alg = 'HS256';
        const jwt = await new jose_1.SignJWT({
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
    async getDashboard(tenantId, relationshipId) {
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
            throw new common_1.UnauthorizedException('Invalid relationship');
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
};
exports.PortalService = PortalService;
exports.PortalService = PortalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        service_request_service_1.ServiceRequestService,
        notification_service_1.NotificationService])
], PortalService);
//# sourceMappingURL=portal.service.js.map