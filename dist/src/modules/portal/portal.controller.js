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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortalController = void 0;
const common_1 = require("@nestjs/common");
const portal_service_1 = require("./portal.service");
const public_decorator_1 = require("../../core/decorators/public.decorator");
const permissions_decorator_1 = require("../../core/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const request_otp_dto_1 = require("./dto/request-otp.dto");
const verify_otp_dto_1 = require("./dto/verify-otp.dto");
const create_service_request_dto_1 = require("../service-request/dto/create-service-request.dto");
const accept_quote_dto_1 = require("./dto/accept-quote.dto");
const create_customer_ticket_dto_1 = require("../support-ticket/dto/create-customer-ticket.dto");
const create_ticket_message_dto_1 = require("../support-ticket/dto/create-ticket-message.dto");
let PortalController = class PortalController {
    portalService;
    constructor(portalService) {
        this.portalService = portalService;
    }
    async requestOtp(slug, requestOtpDto) {
        return this.portalService.requestOtp(slug, requestOtpDto.phone);
    }
    async verifyOtp(slug, verifyOtpDto) {
        return this.portalService.verifyOtp(slug, verifyOtpDto.phone, verifyOtpDto.code);
    }
    async getQuote(slug, quoteId) {
        return this.portalService.getQuoteForCustomer(slug, quoteId);
    }
    async acceptQuote(slug, quoteId, acceptDto, req) {
        const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
        return this.portalService.acceptQuote(slug, quoteId, acceptDto, String(clientIp));
    }
    async getInvoice(slug, invoiceId) {
        return this.portalService.getInvoiceForCustomer(slug, invoiceId);
    }
    async getDashboard(slug, user) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.getDashboard(user.tenantId, user.relationshipId);
    }
    async getJobTracking(slug, jobId, user) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.getLiveJobTracking(user.tenantId, user.relationshipId, jobId);
    }
    async createServiceRequest(slug, user, createDto) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.createServiceRequest(user.tenantId, user.relationshipId, createDto);
    }
    async getServiceRequests(slug, user) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.getCustomerServiceRequests(user.tenantId, user.relationshipId);
    }
    async getInvoicesHistory(slug, user) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.getInvoicesHistory(user.tenantId, user.relationshipId);
    }
    async getInvoiceDetails(slug, invoiceId, user) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.getInvoiceDetails(user.tenantId, user.relationshipId, invoiceId);
    }
    async getJobsHistory(slug, user) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.getJobsHistory(user.tenantId, user.relationshipId);
    }
    async getJobDetails(slug, jobId, user) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.getJobDetails(user.tenantId, user.relationshipId, jobId);
    }
    async getAssetsHistory(slug, user) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.getAssetsHistory(user.tenantId, user.relationshipId);
    }
    async getAssetDetails(slug, assetId, user) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.getAssetDetails(user.tenantId, user.relationshipId, assetId);
    }
    async createSupportTicket(slug, user, createTicketDto) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.createSupportTicket(user.tenantId, user.relationshipId, createTicketDto);
    }
    async getSupportTickets(slug, user) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.getCustomerSupportTickets(user.tenantId, user.relationshipId);
    }
    async getSupportTicketDetails(slug, ticketId, user) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.getSupportTicketDetails(user.tenantId, user.relationshipId, ticketId);
    }
    async postTicketMessage(slug, ticketId, user, createMessageDto) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.postTicketMessage(user.tenantId, user.relationshipId, ticketId, createMessageDto);
    }
    async closeCustomerTicket(slug, ticketId, user) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.closeCustomerTicket(user.tenantId, user.relationshipId, ticketId);
    }
};
exports.PortalController = PortalController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('auth/request-otp'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, request_otp_dto_1.RequestOtpDto]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "requestOtp", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('auth/verify-otp'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, verify_otp_dto_1.VerifyOtpDto]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "verifyOtp", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('quotes/:quoteId'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('quoteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getQuote", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Patch)('quotes/:quoteId/accept'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('quoteId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, accept_quote_dto_1.AcceptQuoteDto, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "acceptQuote", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('invoices/:invoiceId'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('invoiceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('jobs/:jobId/tracking'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getJobTracking", null);
__decorate([
    (0, common_1.Post)('service-requests'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_service_request_dto_1.CreateServiceRequestDto]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "createServiceRequest", null);
__decorate([
    (0, common_1.Get)('service-requests'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getServiceRequests", null);
__decorate([
    (0, common_1.Get)('history/invoices'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getInvoicesHistory", null);
__decorate([
    (0, common_1.Get)('history/invoices/:invoiceId'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('invoiceId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getInvoiceDetails", null);
__decorate([
    (0, common_1.Get)('history/jobs'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getJobsHistory", null);
__decorate([
    (0, common_1.Get)('history/jobs/:jobId'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getJobDetails", null);
__decorate([
    (0, common_1.Get)('history/assets'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getAssetsHistory", null);
__decorate([
    (0, common_1.Get)('history/assets/:assetId'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('assetId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getAssetDetails", null);
__decorate([
    (0, common_1.Post)('support/tickets'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_customer_ticket_dto_1.CreateCustomerTicketDto]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "createSupportTicket", null);
__decorate([
    (0, common_1.Get)('support/tickets'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getSupportTickets", null);
__decorate([
    (0, common_1.Get)('support/tickets/:ticketId'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('ticketId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getSupportTicketDetails", null);
__decorate([
    (0, common_1.Post)('support/tickets/:ticketId/messages'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('ticketId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, create_ticket_message_dto_1.CreateTicketMessageDto]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "postTicketMessage", null);
__decorate([
    (0, common_1.Patch)('support/tickets/:ticketId/close'),
    (0, permissions_decorator_1.Permissions)('customer_portal', 'admin_access'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Param)('ticketId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "closeCustomerTicket", null);
exports.PortalController = PortalController = __decorate([
    (0, common_1.Controller)('portal/:slug'),
    __metadata("design:paramtypes", [portal_service_1.PortalService])
], PortalController);
//# sourceMappingURL=portal.controller.js.map