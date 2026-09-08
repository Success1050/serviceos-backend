import { Controller, Get, Patch, Body, BadRequestException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER)
  async getSettings(@CurrentUser() user: any) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.settingsService.getSettings(user.tenantId);
  }

  @Patch()
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN)
  async updateSettings(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateSettingsDto,
  ) {
    if (!user.tenantId || !user.id) throw new BadRequestException('Invalid user context');
    return this.settingsService.updateSettings(user.tenantId, user.id, updateDto);
  }
}
