import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(tenantId: string, isHQ: boolean, dto: any) {
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

  async getAllRolesForTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.prisma.role.findMany({
      where: {
        OR: [
          { tenantId }, // My own roles (whether HQ or Sub-company)
          ...(tenant.parentId ? [{ tenantId: tenant.parentId, isGlobal: true }] : []), // If I am a Sub-company, include HQ's global roles
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  async assignRoleToUser(tenantId: string, userId: string, roleId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tenantId !== tenantId) throw new NotFoundException('User not found in your tenant');

    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
    });
  }

  async assignDirectPermissions(tenantId: string, userId: string, permissions: string[]) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tenantId !== tenantId) throw new NotFoundException('User not found in your tenant');

    return this.prisma.user.update({
      where: { id: userId },
      data: { directPermissions: permissions },
    });
  }

  async updateRolePermissions(tenantId: string, roleId: string, permissions: string[]) {
    const role = await this.prisma.role.findFirst({ where: { id: roleId, tenantId } });
    if (!role) throw new ForbiddenException('Cannot edit this role or role not found');

    return this.prisma.role.update({
      where: { id: roleId },
      data: { permissions },
    });
  }

  async deleteRole(tenantId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({ where: { id: roleId, tenantId } });
    if (!role) throw new ForbiddenException('Cannot delete this role');

    return this.prisma.role.delete({ where: { id: roleId } });
  }
}
