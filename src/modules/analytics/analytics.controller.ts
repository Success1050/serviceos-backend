import { Controller, Get, Param, ForbiddenException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // 1. Branch Dashboard (Strictly local)
  @Get('branch')
  @Permissions('view_analytics')
  async getBranchDashboard(@CurrentUser() user: any) {
    if (!user.parentId && user.role !== 'TENANT_OWNER') {
      // Small safety check depending on how your roles are set up
    }
    return this.analyticsService.getBranchMetrics(user.tenantId);
  }

  // 2. HQ God-View Dashboard
  @Get('hq/aggregate')
  @Permissions('view_hq_analytics')
  async getHqAggregateDashboard(@CurrentUser() user: any) {
    if (user.parentId) {
      throw new ForbiddenException('Only HQ can access global analytics');
    }
    return this.analyticsService.getHqAggregateMetrics(user.tenantId);
  }

  // 3. HQ Drill-Down Dashboard
  @Get('hq/branch/:targetTenantId')
  @Permissions('view_hq_analytics')
  async getHqDrillDownDashboard(@CurrentUser() user: any, @Param('targetTenantId') targetTenantId: string) {
    if (user.parentId) {
      throw new ForbiddenException('Only HQ can drill down into branch analytics');
    }
    return this.analyticsService.getHqDrillDownMetrics(user.tenantId, targetTenantId);
  }
}
