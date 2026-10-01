import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../../core/auth/jwt.guard';
import { SuperAdminGuard } from '../../core/auth/superadmin.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { SuperAdminTelemetryService } from './services/superadmin-telemetry.service';
import { SuperAdminTenantService } from './services/superadmin-tenant.service';
import { SuperAdminSubscriptionService } from './services/superadmin-subscription.service';
import { SuperAdminImpersonationService } from './services/superadmin-impersonation.service';
import { FilterSuperAdminTenantsDto } from './dto/filter-superadmin-tenants.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { ImpersonateTenantDto } from './dto/impersonate-tenant.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { PrismaService } from '../../core/prisma/prisma.service';

@Controller('superadmin')
@UseGuards(JwtGuard, SuperAdminGuard)
export class SuperAdminController {
  constructor(
    private readonly telemetryService: SuperAdminTelemetryService,
    private readonly tenantService: SuperAdminTenantService,
    private readonly subscriptionService: SuperAdminSubscriptionService,
    private readonly impersonationService: SuperAdminImpersonationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('overview')
  async getOverview() {
    return this.telemetryService.getPlatformOverview();
  }

  @Get('tenants')
  async listTenants(@Query() filter: FilterSuperAdminTenantsDto) {
    return this.tenantService.listTenants(filter);
  }

  @Get('tenants/:id')
  async getTenantById(@Param('id') id: string) {
    return this.tenantService.getTenantById(id);
  }

  @Patch('tenants/:id/status')
  async updateTenantStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTenantStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.tenantService.updateTenantStatus(id, dto, user.id);
  }

  @Post('tenants/:id/impersonate')
  async impersonateTenant(
    @Param('id') id: string,
    @Body() dto: ImpersonateTenantDto,
    @CurrentUser() user: any,
  ) {
    return this.impersonationService.impersonateTenant(id, dto, user);
  }

  @Get('subscriptions/plans')
  async listPlans() {
    return this.subscriptionService.listPlans();
  }

  @Post('subscriptions/plans')
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionService.createPlan(dto);
  }

  @Put('subscriptions/plans/:id')
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.subscriptionService.updatePlan(id, dto);
  }

  @Patch('tenants/:id/subscription')
  async assignSubscription(
    @Param('id') tenantId: string,
    @Body() dto: AssignSubscriptionDto,
  ) {
    return this.subscriptionService.assignSubscription(tenantId, dto);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('action') action?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const where: any = {};
    if (action) where.action = action;
    if (tenantId) where.tenantId = tenantId;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
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
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }
}
