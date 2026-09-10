import { Controller, Get, Post, Patch, Body, Param, BadRequestException, Query } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceScheduleDto } from './dto/create-schedule.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('upcoming')
  @Permissions('admin_access')
  async getUpcoming(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    const lookahead = days ? parseInt(days, 10) : 30;
    return this.maintenanceService.getUpcomingMaintenance(user.tenantId, lookahead);
  }

  @Post('customers/:customerId')
  @Permissions('admin_access')
  async createSchedule(
    @CurrentUser() user: any,
    @Param('customerId') customerId: string,
    @Body() dto: CreateMaintenanceScheduleDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.maintenanceService.createSchedule(user.tenantId, customerId, dto);
  }

  @Patch(':id/complete-cycle')
  @Permissions('admin_access')
  async completeCycle(
    @CurrentUser() user: any,
    @Param('id') scheduleId: string,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.maintenanceService.completeMaintenanceCycle(user.tenantId, scheduleId);
  }
}
