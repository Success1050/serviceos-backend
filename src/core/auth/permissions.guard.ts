import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) return false;

    // SuperAdmins, Tenant Owners, and HQ Admins possess full platform/tenant authority
    if (
      user.isSuperAdmin ||
      user.role === 'TENANT_OWNER' ||
      user.role === 'HQ_ADMIN' ||
      user.role?.name === 'TENANT_OWNER' ||
      user.role?.name === 'HQ_ADMIN'
    ) {
      return true;
    }

    const userPermissions = [
      ...(user.permissions || []),
      ...(user.role?.permissions || []),
      ...(user.directPermissions || []),
    ];

    // Wildcard '*' permission grants access to all system endpoints
    if (userPermissions.includes('*')) {
      return true;
    }

    const hasPermission = requiredPermissions.some((permission) => userPermissions.includes(permission));

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
