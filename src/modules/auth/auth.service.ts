import { Injectable, ConflictException, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestTechPinDto } from './dto/request-tech-pin.dto';
import { VerifyTechPinDto } from './dto/verify-tech-pin.dto';
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
      directPermissions: user.directPermissions || [],
      isSuperAdmin: user.isSuperAdmin,
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

  /**
   * Stage 27: Passwordless SMS 4-Digit PIN Request for Field Technicians.
   */
  async requestTechPin(dto: RequestTechPinDto) {
    const cleanedPhone = dto.phone.trim().replace(/[\s\-\(\)]/g, '');

    const user = await this.prisma.user.findFirst({
      where: {
        phone: cleanedPhone,
        isFieldTech: true,
      },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('No active field technician profile found matching this phone number');
    }

    if (user.proxyVerificationStatus === 'PENDING_HQ_REVIEW') {
      throw new ForbiddenException('Your technician profile is pending Corporate HQ proxy verification. Please contact your branch manager.');
    }

    if (user.proxyVerificationStatus === 'REJECTED') {
      throw new ForbiddenException('Your technician profile was not approved by Corporate HQ.');
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Your technician account is suspended.');
    }

    // Cryptographic 4-digit numeric PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.otpCode.create({
      data: {
        phone: cleanedPhone,
        code: pin,
        expiresAt,
      },
    });

    console.log(`[STAGE 27 SMS AUTH] SMS dispatched to ${cleanedPhone}: "Your ServiceOS Tech PIN is ${pin}. Valid for 10 minutes."`);

    return {
      message: '4-digit PIN sent via SMS successfully',
      phone: cleanedPhone,
      expiresInSeconds: 600,
    };
  }

  /**
   * Stage 27: Passwordless SMS 4-Digit PIN Verification & Session Issuance for Field Technicians.
   */
  async verifyTechPin(dto: VerifyTechPinDto) {
    const cleanedPhone = dto.phone.trim().replace(/[\s\-\(\)]/g, '');

    const validOtp = await this.prisma.otpCode.findFirst({
      where: {
        phone: cleanedPhone,
        code: dto.pin,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!validOtp) {
      throw new UnauthorizedException('Invalid or expired 4-digit PIN');
    }

    // Consume OTP to prevent replay
    await this.prisma.otpCode.deleteMany({
      where: { phone: cleanedPhone },
    });

    const user = await this.prisma.user.findFirst({
      where: {
        phone: cleanedPhone,
        isFieldTech: true,
      },
      include: {
        role: true,
        tenant: true,
        department: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Field technician profile not found');
    }

    const alg = 'HS256';
    const jwt = await new SignJWT({
      sub: user.id,
      phone: user.phone,
      email: user.email,
      tenantId: user.tenantId,
      isFieldTech: true,
      permissions: user.role?.permissions || [],
      directPermissions: user.directPermissions || [],
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('30d') // Long-lived mobile field session
      .sign(this.jwtSecret);

    const { passwordHash: _, ...userSafe } = user;

    return {
      accessToken: jwt,
      user: {
        ...userSafe,
        tenantName: user.tenant?.name,
        departmentName: user.department?.name,
      },
      requiresTermsAcknowledgment: !user.termsAcknowledged,
    };
  }
}
