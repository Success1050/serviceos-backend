import { PrismaService } from '../../core/prisma/prisma.service';
import { MailService } from '../../core/mail/mail.service';
export declare class UserService {
    private readonly prisma;
    private readonly mailService;
    constructor(prisma: PrismaService, mailService: MailService);
    createStaff(dto: any, currentUser: any): Promise<{
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
        roleId: string | null;
        directPermissions: string[];
    })[]>;
    approveStaff(userId: string, currentUser: any): Promise<{
        message: string;
        tempPassword: string;
    }>;
    private processApprovalAndSendEmail;
}
