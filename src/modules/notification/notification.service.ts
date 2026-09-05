import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationGateway } from './gateways/notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  async sendToUser(tenantId: string, userId: string, title: string, message: string, type: string = 'INFO', linkUrl?: string) {
    const notification = await this.prisma.notification.create({
      data: { tenantId, userId, title, message, type, linkUrl },
    });

    this.gateway.sendToUser(tenantId, userId, 'notification', notification);
    return notification;
  }

  async sendToTenant(tenantId: string, title: string, message: string, type: string = 'INFO', linkUrl?: string) {
    const notification = await this.prisma.notification.create({
      data: { tenantId, title, message, type, linkUrl },
    });

    this.gateway.sendToTenant(tenantId, 'notification', notification);
    return notification;
  }

  async getUnreadForUser(tenantId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { tenantId, userId, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecentForTenant(tenantId: string) {
    return this.prisma.notification.findMany({
      where: { tenantId, userId: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
