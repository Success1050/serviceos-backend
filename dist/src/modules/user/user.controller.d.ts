import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    createStaff(createStaffDto: any, currentUser: any): Promise<{
        message: string;
        status: string;
    }>;
    getPendingStaff(currentUser: any): Promise<({
        tenant: {
            name: string;
        } | null;
        department: {
            name: string;
        } | null;
    } & {
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
        role: import("@prisma/client").$Enums.Role | null;
    })[]>;
    approveStaff(userId: string, currentUser: any): Promise<{
        message: string;
        tempPassword: string;
    }>;
}
