import { Controller, Get, Patch, Body, BadRequestException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Permissions('admin_access')
  async getSettings(@CurrentUser() user: any) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.settingsService.getSettings(user.tenantId);
  }

  @Patch()
  @Permissions('admin_access')
  async updateSettings(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateSettingsDto,
  ) {
    if (!user.tenantId || !user.id) throw new BadRequestException('Invalid user context');
    return this.settingsService.updateSettings(user.tenantId, user.id, updateDto);
  }
}
