import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class SuperAdminTelemetryService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformOverview() {
    const [
      totalTenants,
      parentTenantsCount,
      childTenantsCount,
      activeTenantsCount,
      suspendedTenantsCount,
      totalUsers,
      totalTechnicians,
      totalJobs,
      paidInvoicesAggregation,
      subscriptions,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { parentId: null } }),
      this.prisma.tenant.count({ where: { parentId: { not: null } } }),
      this.prisma.tenant.count({ where: { isSuspended: false } }),
      this.prisma.tenant.count({ where: { isSuspended: true } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isFieldTech: true } }),
      this.prisma.job.count(),
      this.prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.tenantSubscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true },
      }),
    ]);

    // Calculate MRR
    let mrr = 0;
    const planDistribution: Record<string, number> = {
      STARTER: 0,
      GROWTH: 0,
      ENTERPRISE: 0,
      CUSTOM: 0,
    };

    for (const sub of subscriptions) {
      const monthlyRate = Number(sub.plan.priceMonthly || 0);
      mrr += monthlyRate;
      const tier = sub.plan.tier;
      planDistribution[tier] = (planDistribution[tier] || 0) + 1;
    }

    const totalRevenue = Number(paidInvoicesAggregation._sum.amount || 0);

    const recentAuditLogs = await this.prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isSuperAdmin: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return {
      metrics: {
        totalTenants,
        parentTenantsCount,
        childTenantsCount,
        activeTenantsCount,
        suspendedTenantsCount,
        totalUsers,
        totalTechnicians,
        totalJobs,
        totalRevenue,
        mrr,
      },
      planDistribution,
      recentAuditLogs,
    };
  }
}
