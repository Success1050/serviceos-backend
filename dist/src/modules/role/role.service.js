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
exports.RoleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let RoleService = class RoleService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRole(tenantId, isHQ, dto) {
        return this.prisma.role.create({
            data: {
                name: dto.name,
                description: dto.description,
                permissions: dto.permissions || [],
                isGlobal: isHQ && dto.isGlobal ? true : false,
                tenantId,
            },
        });
    }
    async getAllRolesForTenant(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        return this.prisma.role.findMany({
            where: {
                OR: [
                    { tenantId },
                    ...(tenant.parentId ? [{ tenantId: tenant.parentId, isGlobal: true }] : []),
                ],
            },
            orderBy: { name: 'asc' },
        });
    }
    async assignRoleToUser(tenantId, userId, roleId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.tenantId !== tenantId)
            throw new common_1.NotFoundException('User not found in your tenant');
        return this.prisma.user.update({
            where: { id: userId },
            data: { roleId },
        });
    }
    async assignDirectPermissions(tenantId, userId, permissions) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.tenantId !== tenantId)
            throw new common_1.NotFoundException('User not found in your tenant');
        return this.prisma.user.update({
            where: { id: userId },
            data: { directPermissions: permissions },
        });
    }
    async updateRolePermissions(tenantId, roleId, permissions) {
        const role = await this.prisma.role.findFirst({ where: { id: roleId, tenantId } });
        if (!role)
            throw new common_1.ForbiddenException('Cannot edit this role or role not found');
        return this.prisma.role.update({
            where: { id: roleId },
            data: { permissions },
        });
    }
    async deleteRole(tenantId, roleId) {
        const role = await this.prisma.role.findFirst({ where: { id: roleId, tenantId } });
        if (!role)
            throw new common_1.ForbiddenException('Cannot delete this role');
        return this.prisma.role.delete({ where: { id: roleId } });
    }
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoleService);
//# sourceMappingURL=role.service.js.map