import { Controller, Post, Get, Patch, Body, Param, BadRequestException } from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @Permissions('admin_access')
  async create(
    @CurrentUser() user: any,
    @Body() createJobDto: CreateJobDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.jobService.createJob(user.tenantId, createJobDto);
  }

  @Get()
  // No explicit Roles restriction here because all staff (including technicians) can get jobs, 
  // but the service filters the query based on their role
  async findAll(@CurrentUser() user: any) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.jobService.getJobs(user.tenantId, user);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') jobId: string,
    @Body() updateDto: UpdateJobStatusDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.jobService.updateJobStatus(user.tenantId, jobId, updateDto, user);
  }
}
