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
exports.MaintenanceController = void 0;
const common_1 = require("@nestjs/common");
const maintenance_service_1 = require("./maintenance.service");
const create_schedule_dto_1 = require("./dto/create-schedule.dto");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let MaintenanceController = class MaintenanceController {
    maintenanceService;
    constructor(maintenanceService) {
        this.maintenanceService = maintenanceService;
    }
    async getUpcoming(user, days) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        const lookahead = days ? parseInt(days, 10) : 30;
        return this.maintenanceService.getUpcomingMaintenance(user.tenantId, lookahead);
    }
    async createSchedule(user, customerId, dto) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.maintenanceService.createSchedule(user.tenantId, customerId, dto);
    }
    async completeCycle(user, scheduleId) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.maintenanceService.completeMaintenanceCycle(user.tenantId, scheduleId);
    }
};
exports.MaintenanceController = MaintenanceController;
__decorate([
    (0, common_1.Get)('upcoming'),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT_OWNER, client_1.Role.TENANT_ADMIN, client_1.Role.MANAGER, client_1.Role.TECHNICIAN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "getUpcoming", null);
__decorate([
    (0, common_1.Post)('customers/:customerId'),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT_OWNER, client_1.Role.TENANT_ADMIN, client_1.Role.MANAGER, client_1.Role.SALES),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('customerId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_schedule_dto_1.CreateMaintenanceScheduleDto]),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "createSchedule", null);
__decorate([
    (0, common_1.Patch)(':id/complete-cycle'),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT_OWNER, client_1.Role.TENANT_ADMIN, client_1.Role.MANAGER, client_1.Role.TECHNICIAN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "completeCycle", null);
exports.MaintenanceController = MaintenanceController = __decorate([
    (0, common_1.Controller)('maintenance'),
    __metadata("design:paramtypes", [maintenance_service_1.MaintenanceService])
], MaintenanceController);
//# sourceMappingURL=maintenance.controller.js.map