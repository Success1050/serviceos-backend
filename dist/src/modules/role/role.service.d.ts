import { PrismaService } from '../../core/prisma/prisma.service';
export declare class RoleService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createRole(tenantId: string, isHQ: boolean, dto: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        permissions: string[];
        description: string | null;
        isGlobal: boolean;
    }>;
    getAllRolesForTenant(tenantId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        permissions: string[];
        description: string | null;
        isGlobal: boolean;
    }[]>;
    assignRoleToUser(tenantId: string, userId: string, roleId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        passwordHash: string;
        phone: string | null;
        firstName: string;
        lastName: string;
        status: import("@prisma/client").$Enums.UserStatus;
        requiresPasswordReset: boolean;
        departmentId: string | null;
        tenantId: string | null;
        roleId: string | null;
        directPermissions: string[];
    }>;
    assignDirectPermissions(tenantId: string, userId: string, permissions: string[]): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        passwordHash: string;
        phone: string | null;
        firstName: string;
        lastName: string;
        status: import("@prisma/client").$Enums.UserStatus;
        requiresPasswordReset: boolean;
        departmentId: string | null;
        tenantId: string | null;
        roleId: string | null;
        directPermissions: string[];
    }>;
    updateRolePermissions(tenantId: string, roleId: string, permissions: string[]): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        permissions: string[];
        description: string | null;
        isGlobal: boolean;
    }>;
    deleteRole(tenantId: string, roleId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        permissions: string[];
        description: string | null;
        isGlobal: boolean;
    }>;
}
