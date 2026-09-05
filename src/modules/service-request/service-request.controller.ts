import { Controller, Get, Patch, Body, Param, BadRequestException } from '@nestjs/common';
import { ServiceRequestService } from './service-request.service';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('service-requests')
export class ServiceRequestController {
  constructor(private readonly serviceRequestService: ServiceRequestService) {}

  @Get()
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER, Role.TECHNICIAN)
  async findAll(@CurrentUser() user: any) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.serviceRequestService.getRequests(user.tenantId);
  }

  @Patch(':id/status')
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER, Role.TECHNICIAN)
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') requestId: string,
    @Body() updateDto: UpdateServiceRequestStatusDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.serviceRequestService.updateStatus(user.tenantId, requestId, updateDto);
  }
}
