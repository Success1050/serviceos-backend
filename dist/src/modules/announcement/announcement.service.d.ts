import { PrismaService } from '../../core/prisma/prisma.service';
export declare class AnnouncementService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        title: string;
        content: string;
        priority: import("@prisma/client").$Enums.AnnouncementPriority;
        targetTenants: string[];
    }>;
    findAllForTenant(tenantId: string): Promise<{
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
