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
exports.SupportTicketController = void 0;
const common_1 = require("@nestjs/common");
const support_ticket_service_1 = require("./support-ticket.service");
const permissions_decorator_1 = require("../../core/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const create_staff_ticket_dto_1 = require("./dto/create-staff-ticket.dto");
const create_ticket_message_dto_1 = require("./dto/create-ticket-message.dto");
const filter_tickets_dto_1 = require("./dto/filter-tickets.dto");
const resolve_warranty_dto_1 = require("./dto/resolve-warranty.dto");
const resolve_dispute_dto_1 = require("./dto/resolve-dispute.dto");
const update_ticket_status_dto_1 = require("./dto/update-ticket-status.dto");
let SupportTicketController = class SupportTicketController {
    supportTicketService;
    constructor(supportTicketService) {
        this.supportTicketService = supportTicketService;
    }
    async createTicket(user, createDto) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        const staffName = `${user.firstName || 'Staff'} ${user.lastName || ''}`.trim();
        return this.supportTicketService.createStaffTicket(user.tenantId, user.id, staffName, createDto);
    }
    async getTickets(user, filterDto) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.supportTicketService.getTickets(user.tenantId, filterDto);
    }
    async getMetrics(user) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.supportTicketService.getSupportMetrics(user.tenantId);
    }
    async getTicketDetails(user, id) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.supportTicketService.getTicketDetails(user.tenantId, id, false);
    }
    async postMessage(user, id, createMessageDto) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        const staffName = `${user.firstName || 'Staff'} ${user.lastName || ''}`.trim();
        return this.supportTicketService.addMessage(user.tenantId, id, {
            senderType: 'STAFF',
            senderUserId: user.id,
            senderName: staffName,
        }, createMessageDto);
    }
    async updateStatus(user, id, updateDto) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.supportTicketService.updateTicketStatus(user.tenantId, id, updateDto, user.id);
    }
    async resolveWarranty(user, id, resolveDto) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        const staffName = `${user.firstName || 'Staff'} ${user.lastName || ''}`.trim();
        return this.supportTicketService.resolveWarrantyClaim(user.tenantId, id, resolveDto, user.id, staffName);
    }
    async resolveDispute(user, id, resolveDto) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        const staffName = `${user.firstName || 'Staff'} ${user.lastName || ''}`.trim();
        return this.supportTicketService.resolveChargeDispute(user.tenantId, id, resolveDto, user.id, staffName);
    }
};
exports.SupportTicketController = SupportTicketController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('manage_support_tickets', 'admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_staff_ticket_dto_1.CreateStaffTicketDto]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('view_support_tickets', 'manage_support_tickets', 'admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, filter_tickets_dto_1.FilterTicketsDto]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "getTickets", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, permissions_decorator_1.Permissions)('view_support_tickets', 'manage_support_tickets', 'admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('view_support_tickets', 'manage_support_tickets', 'admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "getTicketDetails", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    (0, permissions_decorator_1.Permissions)('manage_support_tickets', 'admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_ticket_message_dto_1.CreateTicketMessageDto]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "postMessage", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, permissions_decorator_1.Permissions)('manage_support_tickets', 'admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_ticket_status_dto_1.UpdateTicketStatusDto]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/resolve-warranty'),
    (0, permissions_decorator_1.Permissions)('resolve_warranties', 'manage_support_tickets', 'admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, resolve_warranty_dto_1.ResolveWarrantyDto]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "resolveWarranty", null);
__decorate([
    (0, common_1.Post)(':id/resolve-dispute'),
    (0, permissions_decorator_1.Permissions)('resolve_disputes', 'manage_support_tickets', 'admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, resolve_dispute_dto_1.ResolveDisputeDto]),
    __metadata("design:returntype", Promise)
], SupportTicketController.prototype, "resolveDispute", null);
exports.SupportTicketController = SupportTicketController = __decorate([
    (0, common_1.Controller)('support-tickets'),
    __metadata("design:paramtypes", [support_ticket_service_1.SupportTicketService])
], SupportTicketController);
//# sourceMappingURL=support-ticket.controller.js.map