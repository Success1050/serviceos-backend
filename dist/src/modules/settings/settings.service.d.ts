import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
export declare class SettingsService {
    private readonly prisma;
    private readonly auditLogService;
    constructor(prisma: PrismaService, auditLogService: AuditLogService);
    getSettings(tenantId: string): Promise<{
        lockedByHQ: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        quotes: import("@prisma/client/runtime/library").JsonValue | null;
        invoices: import("@prisma/client/runtime/library").JsonValue | null;
        notifications: import("@prisma/client/runtime/library").JsonValue | null;
        tenantId: string;
        businessProfile: import("@prisma/client/runtime/library").JsonValue | null;
        branding: import("@prisma/client/runtime/library").JsonValue | null;
        portal: import("@prisma/client/runtime/library").JsonValue | null;
        payments: import("@prisma/client/runtime/library").JsonValue | null;
        scheduling: import("@prisma/client/runtime/library").JsonValue | null;
        technicians: import("@prisma/client/runtime/library").JsonValue | null;
        lockedSettings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updateSettings(tenantId: string, userId: string, updateDto: UpdateSettingsDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        quotes: import("@prisma/client/runtime/library").JsonValue | null;
        invoices: import("@prisma/client/runtime/library").JsonValue | null;
        notifications: import("@prisma/client/runtime/library").JsonValue | null;
        tenantId: string;
        businessProfile: import("@prisma/client/runtime/library").JsonValue | null;
        branding: import("@prisma/client/runtime/library").JsonValue | null;
        portal: import("@prisma/client/runtime/library").JsonValue | null;
        payments: import("@prisma/client/runtime/library").JsonValue | null;
        scheduling: import("@prisma/client/runtime/library").JsonValue | null;
        technicians: import("@prisma/client/runtime/library").JsonValue | null;
        lockedSettings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
