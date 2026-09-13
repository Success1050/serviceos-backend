import { NotificationService } from './notification.service';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    getMyNotifications(user: any): Promise<{
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
    getTenantNotifications(user: any): Promise<{
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
    markRead(id: string): Promise<{
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
