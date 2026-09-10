import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getBranchDashboard(user: any): Promise<{
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
    getHqAggregateDashboard(user: any): Promise<{
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
    getHqDrillDownDashboard(user: any, targetTenantId: string): Promise<{
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
}
