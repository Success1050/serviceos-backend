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
        roleId: string | null;
        directPermissions: string[];
    }>;
    login(loginDto: LoginDto): Promise<{
        user: {
            role: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string | null;
                permissions: string[];
                description: string | null;
                isGlobal: boolean;
            } | null;
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
            roleId: string | null;
            directPermissions: string[];
        };
        accessToken: string;
    }>;
    resetTempPassword(body: any): Promise<{
        message: string;
    }>;
}
