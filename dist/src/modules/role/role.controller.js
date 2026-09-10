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
exports.RoleController = void 0;
const common_1 = require("@nestjs/common");
const role_service_1 = require("./role.service");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../core/decorators/permissions.decorator");
let RoleController = class RoleController {
    roleService;
    constructor(roleService) {
        this.roleService = roleService;
    }
    async create(dto, user) {
        const isHQ = !user.parentId;
        return this.roleService.createRole(user.tenantId, isHQ, dto);
    }
    async findAll(user) {
        return this.roleService.getAllRolesForTenant(user.tenantId);
    }
    async assignRole(userId, roleId, user) {
        return this.roleService.assignRoleToUser(user.tenantId, userId, roleId);
    }
    async assignDirectPermissions(userId, permissions, user) {
        return this.roleService.assignDirectPermissions(user.tenantId, userId, permissions);
    }
    async updateRolePermissions(roleId, permissions, user) {
        return this.roleService.updateRolePermissions(user.tenantId, roleId, permissions);
    }
    async remove(id, user) {
        return this.roleService.deleteRole(user.tenantId, id);
    }
};
exports.RoleController = RoleController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('manage_roles'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('manage_roles'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)('assign/:userId'),
    (0, permissions_decorator_1.Permissions)('manage_users'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)('roleId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Patch)('direct-permissions/:userId'),
    (0, permissions_decorator_1.Permissions)('manage_users'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)('permissions')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "assignDirectPermissions", null);
__decorate([
    (0, common_1.Patch)(':id/permissions'),
    (0, permissions_decorator_1.Permissions)('manage_roles'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('permissions')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "updateRolePermissions", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('manage_roles'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "remove", null);
exports.RoleController = RoleController = __decorate([
    (0, common_1.Controller)('roles'),
    __metadata("design:paramtypes", [role_service_1.RoleService])
], RoleController);
//# sourceMappingURL=role.controller.js.map