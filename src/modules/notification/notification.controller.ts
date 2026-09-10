import { Controller, Get, Patch, Param, BadRequestException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CurrentUser } from '../../core/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('me')
  async getMyNotifications(@CurrentUser() user: any) {
    if (!user.tenantId || !user.userId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.notificationService.getUnreadForUser(user.tenantId, user.userId);
  }

  @Get('tenant')
  async getTenantNotifications(@CurrentUser() user: any) {
    if (!user.tenantId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.notificationService.getRecentForTenant(user.tenantId);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}
