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
exports.InternalTicketController = void 0;
const common_1 = require("@nestjs/common");
const internal_ticket_service_1 = require("./internal-ticket.service");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../core/decorators/permissions.decorator");
let InternalTicketController = class InternalTicketController {
    internalTicketService;
    constructor(internalTicketService) {
        this.internalTicketService = internalTicketService;
    }
    async create(dto, user) {
        return this.internalTicketService.createTicket(user.tenantId, user.id, dto);
    }
    async findAll(user) {
        return this.internalTicketService.getTickets(user);
    }
    async updateStatus(id, status, user) {
        return this.internalTicketService.updateTicketStatus(user, id, status);
    }
};
exports.InternalTicketController = InternalTicketController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InternalTicketController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InternalTicketController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, permissions_decorator_1.Permissions)('admin_access'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InternalTicketController.prototype, "updateStatus", null);
exports.InternalTicketController = InternalTicketController = __decorate([
    (0, common_1.Controller)('internal-tickets'),
    __metadata("design:paramtypes", [internal_ticket_service_1.InternalTicketService])
], InternalTicketController);
//# sourceMappingURL=internal-ticket.controller.js.map