import { Injectable, ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { SignJWT } from 'jose';

@Injectable()
export class AuthService {
  private readonly jwtSecret: Uint8Array;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const secretStr = this.configService.get<string>('JWT_SECRET') || 'super-secret-key-for-dev-only-do-not-use-in-prod';
    this.jwtSecret = new TextEncoder().encode(secretStr);
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      },
    });

    // Strip passwordHash from response
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { role: true }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.requiresPasswordReset) {
      throw new ForbiddenException('PASSWORD_RESET_REQUIRED');
    }

    // Generate JWT with jose
    const alg = 'HS256';
    const jwt = await new SignJWT({ 
      sub: user.id, 
      email: user.email, 
      tenantId: user.tenantId,
      permissions: user.role?.permissions || [],
      directPermissions: user.directPermissions || []
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(this.jwtSecret);

    const { passwordHash: _, ...result } = user;
    
    return {
      user: result,
      accessToken: jwt,
    };
  }

  async resetTempPassword(email: string, tempPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.requiresPasswordReset) {
      throw new ConflictException('User does not require a password reset');
    }

    const isMatch = await bcrypt.compare(tempPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid temporary password');
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        requiresPasswordReset: false,
      },
    });

    return { message: 'Password reset successfully. You may now log in.' };
  }
}
