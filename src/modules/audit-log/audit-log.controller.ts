import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Permissions('admin_access')
  async getLogs(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    if (!user.tenantId) throw new BadRequestException('Invalid tenant context');
    const take = limit ? parseInt(limit, 10) : 50;
    const offset = skip ? parseInt(skip, 10) : 0;
    return this.auditLogService.getLogs(user.tenantId, take, offset);
  }
}
