import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationGateway } from './gateways/notification.gateway';
export declare class NotificationService {
    private readonly prisma;
    private readonly gateway;
    constructor(prisma: PrismaService, gateway: NotificationGateway);
    sendToUser(tenantId: string, userId: string, title: string, message: string, type?: string, linkUrl?: string): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        title: string;
        type: string;
        isRead: boolean;
        linkUrl: string | null;
        userId: string | null;
    }>;
    sendToTenant(tenantId: string, title: string, message: string, type?: string, linkUrl?: string): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        title: string;
        type: string;
        isRead: boolean;
        linkUrl: string | null;
        userId: string | null;
    }>;
    getUnreadForUser(tenantId: string, userId: string): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        title: string;
        type: string;
        isRead: boolean;
        linkUrl: string | null;
        userId: string | null;
    }[]>;
    getRecentForTenant(tenantId: string): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        title: string;
        type: string;
        isRead: boolean;
        linkUrl: string | null;
        userId: string | null;
    }[]>;
    markAsRead(id: string): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        title: string;
        type: string;
        isRead: boolean;
        linkUrl: string | null;
        userId: string | null;
    }>;
}
