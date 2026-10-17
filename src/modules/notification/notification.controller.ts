import { Controller, Get, Patch, Post, Param, Body, BadRequestException } from '@nestjs/common';
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

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: any) {
    if (!user.tenantId || !user.userId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.notificationService.markAllAsRead(user.tenantId, user.userId);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Post('test')
  async sendTestNotification(
    @CurrentUser() user: any,
    @Body() body: { title?: string; message?: string; type?: string; linkUrl?: string }
  ) {
    if (!user.tenantId || !user.userId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.notificationService.sendToUser(
      user.tenantId,
      user.userId,
      body.title || 'New Quote Accepted',
      body.message || 'Client Sunshine Estates has accepted Quote #QT-8821 for ₦2,500,000.',
      body.type || 'QUOTE',
      body.linkUrl || '/app/quotes'
    );
  }
}

