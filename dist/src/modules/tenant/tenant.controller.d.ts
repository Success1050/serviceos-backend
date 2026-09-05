import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
export declare class TenantController {
    private readonly tenantService;
    constructor(tenantService: TenantService);
    create(createTenantDto: CreateTenantDto, user: any): Promise<{
        settings: {
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
        } | null;
    } & {
        name: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getBySlug(slug: string): Promise<{
        settings: {
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
        } | null;
    } & {
        name: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
