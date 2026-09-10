import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. SUB-COMPANY (BRANCH) DASHBOARD
  // ==========================================
  async getBranchMetrics(tenantId: string) {
    const tenantFilter = { equals: tenantId };
    return this.calculateCoreMetrics(tenantFilter);
  }

  // ==========================================
  // 2. HQ AGGREGATE DASHBOARD (GOD-VIEW)
  // ==========================================
  async getHqAggregateMetrics(hqTenantId: string) {
    const children = await this.prisma.tenant.findMany({ where: { parentId: hqTenantId } });
    const allTenantIds = [hqTenantId, ...children.map((c) => c.id)];
    const tenantFilter = { in: allTenantIds };

    // Get core operational/financial metrics across the whole network
    const coreMetrics = await this.calculateCoreMetrics(tenantFilter);

    // HQ Specific Franchise Metrics
    const totalSubCompanies = children.length;
    const totalSystemEmployees = await this.prisma.user.count({ where: { tenantId: tenantFilter } });

    // Leaderboard (Top 5 Branches by Revenue)
    const topBranchesAgg = await this.prisma.invoice.groupBy({
      by: ['tenantId'],
      where: { tenantId: tenantFilter, status: 'PAID' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    });

    const branchIds = topBranchesAgg.map((b) => b.tenantId);
    const branches = await this.prisma.tenant.findMany({ where: { id: { in: branchIds } } });
    const branchMap = new Map(branches.map((b) => [b.id, b.name]));

    const leaderboard = topBranchesAgg.map((b) => ({
      tenantId: b.tenantId,
      branchName: branchMap.get(b.tenantId) || 'Unknown',
      revenue: b._sum.amount || 0,
    }));

    return {
      ...coreMetrics,
      franchiseOverview: {
        totalSubCompanies,
        totalSystemEmployees,
        leaderboard,
      },
    };
  }

  // ==========================================
  // 3. HQ DRILL-DOWN DASHBOARD (SINGLE BRANCH)
  // ==========================================
  async getHqDrillDownMetrics(hqTenantId: string, targetTenantId: string) {
    // Security check: Verify HQ owns this branch
    const target = await this.prisma.tenant.findUnique({ where: { id: targetTenantId } });
    if (!target || (target.parentId !== hqTenantId && target.id !== hqTenantId)) {
      throw new ForbiddenException('You do not have permission to view this branch');
    }

    const tenantFilter = { equals: targetTenantId };
    const coreMetrics = await this.calculateCoreMetrics(tenantFilter);

    // Branch-specific drill-down extra data
    const branchStaffCount = await this.prisma.user.count({ where: { tenantId: targetTenantId } });

    return {
      branchName: target.name,
      ...coreMetrics,
      branchStaff: {
        totalStaff: branchStaffCount,
      },
    };
  }

  // ==========================================
  // SHARED CALCULATION ENGINE
  // ==========================================
  private async calculateCoreMetrics(tenantFilter: any) {
    // Financials
    const revenueAgg = await this.prisma.invoice.aggregate({
      where: { tenantId: tenantFilter, status: 'PAID' },
      _sum: { amount: true },
    });
    const totalRevenue = Number(revenueAgg._sum.amount || 0);

    const outstandingAgg = await this.prisma.invoice.aggregate({
      where: { tenantId: tenantFilter, status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] } },
      _sum: { amount: true },
    });
    const outstandingReceivables = Number(outstandingAgg._sum.amount || 0);

    // Operational
    const totalJobs = await this.prisma.job.count({
      where: { tenantId: tenantFilter, status: 'COMPLETED' },
    });
    
    const openJobs = await this.prisma.job.count({
      where: { tenantId: tenantFilter, status: { in: ['SCHEDULED', 'IN_PROGRESS', 'EN_ROUTE'] } },
    });

    const lostJobs = await this.prisma.job.count({
      where: { tenantId: tenantFilter, status: 'CANCELLED' }, // New Metric
    });

    const activeCustomers = await this.prisma.customerRecord.count({
      where: { tenantId: tenantFilter },
    });

    const averageTicketSize = totalJobs > 0 ? (totalRevenue / totalJobs).toFixed(2) : 0; // New Metric

    return {
      financials: {
        totalGrossRevenue: totalRevenue,
        outstandingReceivables,
        averageTicketSize: Number(averageTicketSize),
      },
      operational: {
        totalJobsCompleted: totalJobs,
        openJobs,
        lostOrCancelledJobs: lostJobs,
        activeCustomers,
      }
    };
  }
}
