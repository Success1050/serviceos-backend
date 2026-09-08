import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly configService;
    private readonly jwtSecret;
    constructor(prisma: PrismaService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        phone: string | null;
        firstName: string;
        lastName: string;
        status: import("@prisma/client").$Enums.UserStatus;
        requiresPasswordReset: boolean;
        departmentId: string | null;
        tenantId: string | null;
        role: import("@prisma/client").$Enums.Role | null;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            phone: string | null;
            firstName: string;
            lastName: string;
            status: import("@prisma/client").$Enums.UserStatus;
            requiresPasswordReset: boolean;
            departmentId: string | null;
            tenantId: string | null;
            role: import("@prisma/client").$Enums.Role | null;
        };
        accessToken: string;
    }>;
    resetTempPassword(email: string, tempPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
}
