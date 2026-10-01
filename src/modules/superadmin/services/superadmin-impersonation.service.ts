import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ImpersonateTenantDto } from '../dto/impersonate-tenant.dto';
import { SignJWT } from 'jose';

@Injectable()
export class SuperAdminImpersonationService {
  private readonly jwtSecret: Uint8Array;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const secretStr =
      this.configService.get<string>('JWT_SECRET') ||
      'super-secret-key-for-dev-only-do-not-use-in-prod';
    this.jwtSecret = new TextEncoder().encode(secretStr);
  }

  async impersonateTenant(
    tenantId: string,
    dto: ImpersonateTenantDto,
    superAdminUser: any,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          include: { role: true },
          take: 10,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Target tenant not found');
    }

    let targetUser: any = null;

    if (dto.targetUserId) {
      targetUser = tenant.users.find((u) => u.id === dto.targetUserId);
      if (!targetUser) {
        // Try direct lookup
        targetUser = await this.prisma.user.findFirst({
          where: { id: dto.targetUserId, tenantId },
          include: { role: true },
        });
      }
      if (!targetUser) {
        throw new NotFoundException(
          `Target user ${dto.targetUserId} does not belong to tenant ${tenant.name}`,
        );
      }
    } else {
      // Pick first active user or tenant owner
      targetUser =
        tenant.users.find(
          (u) =>
            u.role?.name === 'TENANT_OWNER' ||
            u.role?.name === 'TENANT_ADMIN' ||
            u.role?.name === 'Owner' ||
            u.role?.name === 'Admin',
        ) || tenant.users[0];

      if (!targetUser) {
        throw new BadRequestException(
          'No active users available in this tenant to impersonate',
        );
      }
    }

    // Sign audited impersonation JWT (1 hour validity)
    const alg = 'HS256';
    const accessToken = await new SignJWT({
      sub: targetUser.id,
      email: targetUser.email,
      tenantId: tenant.id,
      role: targetUser.role?.name || 'TENANT_OWNER',
      permissions: targetUser.role?.permissions || [],
      directPermissions: targetUser.directPermissions || [],
      isImpersonating: true,
      impersonatedBy: superAdminUser.id,
      originalEmail: superAdminUser.email,
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(this.jwtSecret);

    // Record immutable audit log
    await this.prisma.auditLog.create({
      data: {
        userId: superAdminUser.id,
        tenantId: tenant.id,
        action: 'SUPERADMIN_IMPERSONATE',
        entityType: 'TENANT',
        entityId: tenant.id,
        details: {
          impersonatorId: superAdminUser.id,
          impersonatorEmail: superAdminUser.email,
          targetTenantId: tenant.id,
          targetTenantName: tenant.name,
          targetUserId: targetUser.id,
          targetUserEmail: targetUser.email,
          reason: dto.reason,
          timestamp: new Date().toISOString(),
        },
      },
    });

    const { passwordHash: _, ...sanitizedUser } = targetUser;

    return {
      accessToken,
      targetTenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      impersonatedUser: sanitizedUser,
      expiresIn: 3600,
    };
  }
}
