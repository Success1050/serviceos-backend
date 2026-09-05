import { Controller, Get, Post, Patch, Body, Param, BadRequestException, Query } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceScheduleDto } from './dto/create-schedule.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('upcoming')
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER, Role.TECHNICIAN)
  async getUpcoming(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    const lookahead = days ? parseInt(days, 10) : 30;
    return this.maintenanceService.getUpcomingMaintenance(user.tenantId, lookahead);
  }

  @Post('customers/:customerId')
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER, Role.SALES)
  async createSchedule(
    @CurrentUser() user: any,
    @Param('customerId') customerId: string,
    @Body() dto: CreateMaintenanceScheduleDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.maintenanceService.createSchedule(user.tenantId, customerId, dto);
  }

  @Patch(':id/complete-cycle')
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER, Role.TECHNICIAN)
  async completeCycle(
    @CurrentUser() user: any,
    @Param('id') scheduleId: string,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.maintenanceService.completeMaintenanceCycle(user.tenantId, scheduleId);
  }
}
