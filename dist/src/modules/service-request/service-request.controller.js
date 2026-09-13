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
exports.ServiceRequestController = void 0;
const common_1 = require("@nestjs/common");
const service_request_service_1 = require("./service-request.service");
const update_service_request_status_dto_1 = require("./dto/update-service-request-status.dto");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../core/decorators/permissions.decorator");
let ServiceRequestController = class ServiceRequestController {
    serviceRequestService;
    constructor(serviceRequestService) {
        this.serviceRequestService = serviceRequestService;
    }
    async findAll(user) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.serviceRequestService.getRequests(user.tenantId);
    }
    async updateStatus(user, requestId, updateDto) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.serviceRequestService.updateStatus(user.tenantId, requestId, updateDto);
    }
};
exports.ServiceRequestController = ServiceRequestController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, permissions_decorator_1.Permissions)('admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_service_request_status_dto_1.UpdateServiceRequestStatusDto]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "updateStatus", null);
exports.ServiceRequestController = ServiceRequestController = __decorate([
    (0, common_1.Controller)('service-requests'),
    __metadata("design:paramtypes", [service_request_service_1.ServiceRequestService])
], ServiceRequestController);
//# sourceMappingURL=service-request.controller.js.map