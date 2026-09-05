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
exports.InvoiceController = void 0;
const common_1 = require("@nestjs/common");
const invoice_service_1 = require("./invoice.service");
const create_invoice_dto_1 = require("./dto/create-invoice.dto");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let InvoiceController = class InvoiceController {
    invoiceService;
    constructor(invoiceService) {
        this.invoiceService = invoiceService;
    }
    async create(user, createInvoiceDto) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.invoiceService.createInvoice(user.tenantId, createInvoiceDto);
    }
    async findAll(user) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.invoiceService.getInvoices(user.tenantId);
    }
    async send(user, invoiceId) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.invoiceService.sendInvoice(user.tenantId, invoiceId);
    }
    async markAsPaid(user, invoiceId) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.invoiceService.markAsPaid(user.tenantId, invoiceId);
    }
};
exports.InvoiceController = InvoiceController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT_OWNER, client_1.Role.TENANT_ADMIN, client_1.Role.MANAGER, client_1.Role.ACCOUNTANT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_invoice_dto_1.CreateInvoiceDto]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT_OWNER, client_1.Role.TENANT_ADMIN, client_1.Role.MANAGER, client_1.Role.ACCOUNTANT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT_OWNER, client_1.Role.TENANT_ADMIN, client_1.Role.MANAGER, client_1.Role.ACCOUNTANT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "send", null);
__decorate([
    (0, common_1.Patch)(':id/pay'),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT_OWNER, client_1.Role.TENANT_ADMIN, client_1.Role.MANAGER, client_1.Role.ACCOUNTANT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "markAsPaid", null);
exports.InvoiceController = InvoiceController = __decorate([
    (0, common_1.Controller)('invoices'),
    __metadata("design:paramtypes", [invoice_service_1.InvoiceService])
], InvoiceController);
//# sourceMappingURL=invoice.controller.js.map