export class TenancyUtil {
  /**
   * Resolves the Prisma where-clause for multi-tenant entity filtering:
   * - Platform SuperAdmin (isSuperAdmin = true):
   *     Global access across all tenants; or filter by targetTenantId if provided.
   * - Franchise HQ (role === 'HQ_ADMIN' or root tenant without parentId):
   *     Can view/manage HQ and all subcompanies { OR: [{ tenantId }, { tenant: { parentId: tenantId } }] }.
   * - Standard Tenant:
   *     Restricted strictly to user.tenantId.
   */
  static getTenantScopeFilter(user: any, targetTenantId?: string): any {
    if (user?.isSuperAdmin) {
      if (targetTenantId) {
        return { tenantId: targetTenantId };
      }
      return {};
    }

    const isHq =
      user?.role === 'HQ_ADMIN' ||
      user?.role?.name === 'HQ_ADMIN' ||
      (!user?.parentId && Boolean(user?.tenantId));

    if (isHq && user?.tenantId) {
      if (targetTenantId) {
        return {
          AND: [
            { tenantId: targetTenantId },
            {
              OR: [
                { tenantId: user.tenantId },
                { tenant: { parentId: user.tenantId } },
              ],
            },
          ],
        };
      }
      return {
        OR: [
          { tenantId: user.tenantId },
          { tenant: { parentId: user.tenantId } },
        ],
      };
    }

    if (user?.tenantId) {
      return { tenantId: user.tenantId };
    }

    return {};
  }

  /**
   * Checks if user has permission to operate on a record belonging to targetTenantId
   */
  static isAuthorizedForTenant(
    user: any,
    targetTenantId: string,
    parentTenantId?: string | null,
  ): boolean {
    if (user?.isSuperAdmin) return true;
    if (user?.tenantId && user.tenantId === targetTenantId) return true;
    const isHq =
      user?.role === 'HQ_ADMIN' ||
      user?.role?.name === 'HQ_ADMIN' ||
      (!user?.parentId && Boolean(user?.tenantId));
    if (isHq && user?.tenantId && parentTenantId === user.tenantId) return true;
    return false;
  }
}
