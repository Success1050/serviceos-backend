import { RoleService } from './role.service';
export declare class RoleController {
    private readonly roleService;
    constructor(roleService: RoleService);
    create(dto: any, user: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        permissions: string[];
        description: string | null;
        isGlobal: boolean;
    }>;
    findAll(user: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        permissions: string[];
        description: string | null;
        isGlobal: boolean;
    }[]>;
    assignRole(userId: string, roleId: string, user: any): Promise<{
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
    assignDirectPermissions(userId: string, permissions: string[], user: any): Promise<{
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
    updateRolePermissions(roleId: string, permissions: string[], user: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        permissions: string[];
        description: string | null;
        isGlobal: boolean;
    }>;
    remove(id: string, user: any): Promise<{
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
