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
        roleId: string | null;
        directPermissions: string[];
        lastKnownLatitude: number | null;
        lastKnownLongitude: number | null;
        lastLocationUpdate: Date | null;
        avatarUrl: string | null;
        bio: string | null;
        certifications: string[];
        rating: number | null;
        jobsCompletedCount: number;
        isFieldTech: boolean;
        tradeSpecialty: string | null;
        customCommissionRate: import("@prisma/client/runtime/library").Decimal | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        proxyVerificationStatus: import("@prisma/client").$Enums.ProxyVerificationStatus;
        managerEndorsementNotes: string | null;
        managerVerifiedAt: Date | null;
        managerVerifiedById: string | null;
        hqReviewNotes: string | null;
        hqReviewedAt: Date | null;
        hqReviewedById: string | null;
        termsAcknowledged: boolean;
        termsAcknowledgedAt: Date | null;
        termsAcknowledgedIp: string | null;
        termsAcknowledgedUserAgent: string | null;
        termsVersion: string | null;
        agreedCommissionSnapshot: import("@prisma/client/runtime/library").Decimal | null;
    })[]>;
    approveStaff(userId: string, currentUser: any): Promise<{
        message: string;
        tempPassword: string;
    }>;
    updateLocation(body: {
        latitude: number;
        longitude: number;
    }, currentUser: any): Promise<{
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
        lastKnownLatitude: number | null;
        lastKnownLongitude: number | null;
        lastLocationUpdate: Date | null;
        avatarUrl: string | null;
        bio: string | null;
        certifications: string[];
        rating: number | null;
        jobsCompletedCount: number;
        isFieldTech: boolean;
        tradeSpecialty: string | null;
        customCommissionRate: import("@prisma/client/runtime/library").Decimal | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        proxyVerificationStatus: import("@prisma/client").$Enums.ProxyVerificationStatus;
        managerEndorsementNotes: string | null;
        managerVerifiedAt: Date | null;
        managerVerifiedById: string | null;
        hqReviewNotes: string | null;
        hqReviewedAt: Date | null;
        hqReviewedById: string | null;
        termsAcknowledged: boolean;
        termsAcknowledgedAt: Date | null;
        termsAcknowledgedIp: string | null;
        termsAcknowledgedUserAgent: string | null;
        termsVersion: string | null;
        agreedCommissionSnapshot: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
