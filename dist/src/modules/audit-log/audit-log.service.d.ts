import { PrismaService } from '../../core/prisma/prisma.service';
export declare class AuditLogService {
    private prisma;
    constructor(prisma: PrismaService);
    logAction(tenantId: string, userId: string | null, action: string, entityType: string, entityId?: string, details?: any): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        userId: string | null;
        action: string;
        entityType: string;
        entityId: string | null;
        details: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getLogs(tenantId: string, limit?: number, skip?: number): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        tenantId: string;
        userId: string | null;
        action: string;
        entityType: string;
        entityId: string | null;
        details: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
}
