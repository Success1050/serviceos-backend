import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(user: any): Promise<{
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
    updateSettings(user: any, updateDto: UpdateSettingsDto): Promise<{
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
