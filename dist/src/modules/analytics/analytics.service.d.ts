import { PrismaService } from '../../core/prisma/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getBranchMetrics(tenantId: string): Promise<{
        financials: {
            totalGrossRevenue: number;
            outstandingReceivables: number;
            averageTicketSize: number;
        };
        operational: {
            totalJobsCompleted: number;
            openJobs: number;
            lostOrCancelledJobs: number;
            activeCustomers: number;
        };
    }>;
    getHqAggregateMetrics(hqTenantId: string): Promise<{
        franchiseOverview: {
            totalSubCompanies: number;
            totalSystemEmployees: number;
            leaderboard: {
                tenantId: string;
                branchName: string;
                revenue: number | import("@prisma/client/runtime/library").Decimal;
            }[];
        };
        financials: {
            totalGrossRevenue: number;
            outstandingReceivables: number;
            averageTicketSize: number;
        };
        operational: {
            totalJobsCompleted: number;
            openJobs: number;
            lostOrCancelledJobs: number;
            activeCustomers: number;
        };
    }>;
    getHqDrillDownMetrics(hqTenantId: string, targetTenantId: string): Promise<{
        branchStaff: {
            totalStaff: number;
        };
        financials: {
            totalGrossRevenue: number;
            outstandingReceivables: number;
            averageTicketSize: number;
        };
        operational: {
            totalJobsCompleted: number;
            openJobs: number;
            lostOrCancelledJobs: number;
            activeCustomers: number;
        };
        branchName: string;
    }>;
    private calculateCoreMetrics;
}
