import { Controller, Get, Post, Patch, Body, Param, BadRequestException, Query } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceScheduleDto } from './dto/create-schedule.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('schedules')
  @Permissions('admin_access')
  async getAllSchedules(@CurrentUser() user: any) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.maintenanceService.getAllSchedules(user.tenantId);
  }

  @Get()
  @Permissions('admin_access')
  async getRootSchedules(@CurrentUser() user: any) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.maintenanceService.getAllSchedules(user.tenantId);
  }

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

  @Post('schedules')
  @Permissions('admin_access')
  async createScheduleWithBody(
    @CurrentUser() user: any,
    @Body() dto: CreateMaintenanceScheduleDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.maintenanceService.createSchedule(user.tenantId, dto.customerRecordId || dto.customerId, dto);
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

  @Post('generate-due-jobs')
  @Permissions('admin_access')
  async generateDueJobsManually(@CurrentUser() user: any) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.maintenanceService.generateJobsForDueSchedules();
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

  @Patch(':id/status')
  @Permissions('admin_access')
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') scheduleId: string,
    @Body('status') status: 'ACTIVE' | 'PAUSED' | 'CANCELLED',
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    if (!['ACTIVE', 'PAUSED', 'CANCELLED'].includes(status)) {
      throw new BadRequestException('Invalid status value');
    }
    return this.maintenanceService.updateScheduleStatus(user.tenantId, scheduleId, status);
  }
}
