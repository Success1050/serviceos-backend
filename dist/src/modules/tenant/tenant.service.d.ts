import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
export declare class TenantService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createTenant(createTenantDto: CreateTenantDto, ownerId: string): Promise<{
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
            lockedSettings: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
    } & {
        name: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        parentId: string | null;
    }>;
    createSubCompany(parentId: string, createTenantDto: CreateTenantDto): Promise<{
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
            lockedSettings: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
    } & {
        name: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        parentId: string | null;
    }>;
    getTenantBySlug(slug: string): Promise<{
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
            lockedSettings: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
    } & {
        name: string;
        slug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        parentId: string | null;
    }>;
}
