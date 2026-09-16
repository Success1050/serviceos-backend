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
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const jwt_guard_1 = require("../../core/auth/jwt.guard");
const permissions_guard_1 = require("../../core/auth/permissions.guard");
const permissions_decorator_1 = require("../../core/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const public_decorator_1 = require("../../core/decorators/public.decorator");
const authorize_hold_dto_1 = require("./dto/authorize-hold.dto");
const capture_hold_dto_1 = require("./dto/capture-hold.dto");
const initialize_checkout_dto_1 = require("./dto/initialize-checkout.dto");
const log_bank_transfer_dto_1 = require("./dto/log-bank-transfer.dto");
let PaymentController = class PaymentController {
    paymentService;
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    async authorizeHold(user, dto) {
        return this.paymentService.authorizePreArrivalHoldForJob(dto.jobId, user.tenantId, dto.paymentMethodToken);
    }
    async captureHold(user, holdId) {
        return this.paymentService.captureEscrowHoldForJob(holdId, user.tenantId);
    }
    async releaseHold(user, holdId, dto) {
        return this.paymentService.releaseEscrowHold(holdId, user.tenantId, dto?.reason);
    }
    async getEscrowHolds(user) {
        return this.paymentService.getEscrowHolds(user.tenantId);
    }
    async convertMilestoneToInvoice(user, milestoneId, dto) {
        return this.paymentService.convertMilestoneToInvoice(user.tenantId, milestoneId, dto?.dueInDays);
    }
    async initializeCheckout(user, dto) {
        return this.paymentService.initializeCheckout(user.tenantId, dto.invoiceId, dto.callbackUrl);
    }
    async logBankTransfer(user, dto) {
        return this.paymentService.logManualBankTransfer(user.tenantId, user.id, dto);
    }
    async handleWebhook(gateway, payload, paystackSignature, stripeSignature) {
        const gatewayUpper = gateway.toUpperCase();
        const signature = paystackSignature || stripeSignature;
        return this.paymentService.handleWebhook(gatewayUpper, payload, signature);
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('escrow/authorize'),
    (0, permissions_decorator_1.Permissions)('payments_manage'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, authorize_hold_dto_1.AuthorizeHoldDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "authorizeHold", null);
__decorate([
    (0, common_1.Post)('escrow/:id/capture'),
    (0, permissions_decorator_1.Permissions)('payments_manage'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "captureHold", null);
__decorate([
    (0, common_1.Post)('escrow/:id/release'),
    (0, permissions_decorator_1.Permissions)('payments_manage'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, capture_hold_dto_1.ReleaseHoldDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "releaseHold", null);
__decorate([
    (0, common_1.Get)('escrow'),
    (0, permissions_decorator_1.Permissions)('payments_view'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getEscrowHolds", null);
__decorate([
    (0, common_1.Post)('milestones/:id/invoice'),
    (0, permissions_decorator_1.Permissions)('milestone_manage'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "convertMilestoneToInvoice", null);
__decorate([
    (0, common_1.Post)('checkout'),
    (0, permissions_decorator_1.Permissions)('payments_manage'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, initialize_checkout_dto_1.InitializeCheckoutDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "initializeCheckout", null);
__decorate([
    (0, common_1.Post)('bank-transfer/confirm'),
    (0, permissions_decorator_1.Permissions)('payments_manage'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, log_bank_transfer_dto_1.LogBankTransferDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "logBankTransfer", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('webhook/:gateway'),
    __param(0, (0, common_1.Param)('gateway')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-paystack-signature')),
    __param(3, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "handleWebhook", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('payments'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map