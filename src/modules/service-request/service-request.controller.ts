import { Controller, Get, Patch, Body, Param, BadRequestException } from '@nestjs/common';
import { ServiceRequestService } from './service-request.service';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@Controller('service-requests')
export class ServiceRequestController {
  constructor(private readonly serviceRequestService: ServiceRequestService) {}

  @Get()
  @Permissions('admin_access')
  async findAll(@CurrentUser() user: any) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.serviceRequestService.getRequests(user.tenantId);
  }

  @Patch(':id/status')
  @Permissions('admin_access')
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') requestId: string,
    @Body() updateDto: UpdateServiceRequestStatusDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.serviceRequestService.updateStatus(user.tenantId, requestId, updateDto);
  }
}
