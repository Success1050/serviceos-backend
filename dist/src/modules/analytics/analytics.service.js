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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBranchMetrics(tenantId) {
        const tenantFilter = { equals: tenantId };
        return this.calculateCoreMetrics(tenantFilter);
    }
    async getHqAggregateMetrics(hqTenantId) {
        const children = await this.prisma.tenant.findMany({ where: { parentId: hqTenantId } });
        const allTenantIds = [hqTenantId, ...children.map((c) => c.id)];
        const tenantFilter = { in: allTenantIds };
        const coreMetrics = await this.calculateCoreMetrics(tenantFilter);
        const totalSubCompanies = children.length;
        const totalSystemEmployees = await this.prisma.user.count({ where: { tenantId: tenantFilter } });
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
    async getHqDrillDownMetrics(hqTenantId, targetTenantId) {
        const target = await this.prisma.tenant.findUnique({ where: { id: targetTenantId } });
        if (!target || (target.parentId !== hqTenantId && target.id !== hqTenantId)) {
            throw new common_1.ForbiddenException('You do not have permission to view this branch');
        }
        const tenantFilter = { equals: targetTenantId };
        const coreMetrics = await this.calculateCoreMetrics(tenantFilter);
        const branchStaffCount = await this.prisma.user.count({ where: { tenantId: targetTenantId } });
        return {
            branchName: target.name,
            ...coreMetrics,
            branchStaff: {
                totalStaff: branchStaffCount,
            },
        };
    }
    async calculateCoreMetrics(tenantFilter) {
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
        const totalJobs = await this.prisma.job.count({
            where: { tenantId: tenantFilter, status: 'COMPLETED' },
        });
        const openJobs = await this.prisma.job.count({
            where: { tenantId: tenantFilter, status: { in: ['SCHEDULED', 'IN_PROGRESS', 'EN_ROUTE'] } },
        });
        const lostJobs = await this.prisma.job.count({
            where: { tenantId: tenantFilter, status: 'CANCELLED' },
        });
        const activeCustomers = await this.prisma.customerRecord.count({
            where: { tenantId: tenantFilter },
        });
        const averageTicketSize = totalJobs > 0 ? (totalRevenue / totalJobs).toFixed(2) : 0;
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map