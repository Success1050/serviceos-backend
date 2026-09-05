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
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const request_otp_dto_1 = require("./dto/request-otp.dto");
const verify_otp_dto_1 = require("./dto/verify-otp.dto");
const create_service_request_dto_1 = require("../service-request/dto/create-service-request.dto");
let PortalController = class PortalController {
    portalService;
    constructor(portalService) {
        this.portalService = portalService;
    }
    async createServiceRequest(slug, user, createDto) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.createServiceRequest(user.tenantId, user.relationshipId, createDto);
    }
    async getQuote(slug, quoteId) {
        return this.portalService.getQuoteForCustomer(slug, quoteId);
    }
    async acceptQuote(slug, quoteId) {
        return this.portalService.acceptQuote(slug, quoteId);
    }
    async getInvoice(slug, invoiceId) {
        return this.portalService.getInvoiceForCustomer(slug, invoiceId);
    }
    async requestOtp(slug, requestOtpDto) {
        return this.portalService.requestOtp(slug, requestOtpDto.phone);
    }
    async verifyOtp(slug, verifyOtpDto) {
        return this.portalService.verifyOtp(slug, verifyOtpDto.phone, verifyOtpDto.code);
    }
    async getDashboard(slug, user) {
        if (!user.tenantId || !user.relationshipId) {
            throw new common_1.BadRequestException('Invalid customer context');
        }
        return this.portalService.getDashboard(user.tenantId, user.relationshipId);
    }
};
exports.PortalController = PortalController;
__decorate([
    (0, common_1.Post)('service-requests'),
    (0, roles_decorator_1.Roles)('CUSTOMER'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_service_request_dto_1.CreateServiceRequestDto]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "createServiceRequest", null);
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
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
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)('CUSTOMER'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PortalController.prototype, "getDashboard", null);
exports.PortalController = PortalController = __decorate([
    (0, common_1.Controller)('portal/:slug'),
    __metadata("design:paramtypes", [portal_service_1.PortalService])
], PortalController);
//# sourceMappingURL=portal.controller.js.map