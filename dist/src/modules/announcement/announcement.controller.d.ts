import { AnnouncementService } from './announcement.service';
export declare class AnnouncementController {
    private readonly announcementService;
    constructor(announcementService: AnnouncementService);
    create(dto: any, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        title: string;
        content: string;
        priority: import("@prisma/client").$Enums.AnnouncementPriority;
        targetTenants: string[];
    }>;
    findAll(user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        title: string;
        content: string;
        priority: import("@prisma/client").$Enums.AnnouncementPriority;
        targetTenants: string[];
    }[]>;
}
