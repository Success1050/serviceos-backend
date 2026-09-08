import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    resetTempPassword(body: any): Promise<{
        message: string;
    }>;
}
