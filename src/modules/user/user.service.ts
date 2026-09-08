import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { MailService } from '../../core/mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async createStaff(dto: any, currentUser: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: currentUser.tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const isSubCompany = !!tenant.parentId;
    
    // If it's a sub-company, require approval. If HQ, auto-approve.
    const initialStatus = isSubCompany ? 'PENDING_APPROVAL' : 'ACTIVE';
    
    // We create them with a dummy password hash until approved
    const dummyHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash: dummyHash,
        role: dto.role,
        departmentId: dto.departmentId || null,
        tenantId: tenant.id,
        status: initialStatus,
        requiresPasswordReset: initialStatus === 'ACTIVE',
      },
    });

    if (initialStatus === 'ACTIVE') {
      await this.processApprovalAndSendEmail(user.id, tenant);
    }

    return { message: 'Staff member created successfully', status: initialStatus };
  }

  async getPendingStaff(currentUser: any) {
    // Return staff that belong to sub-companies of the current user's tenant
    return this.prisma.user.findMany({
      where: {
        status: 'PENDING_APPROVAL',
        tenant: {
          parentId: currentUser.tenantId,
        },
      },
      include: {
        tenant: { select: { name: true } },
        department: { select: { name: true } },
      }
    });
  }

  async approveStaff(userId: string, currentUser: any) {
    const userToApprove = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!userToApprove) throw new NotFoundException('User not found');
    
    if (userToApprove.tenant && userToApprove.tenant.parentId !== currentUser.tenantId) {
      throw new ForbiddenException('You can only approve staff for your own sub-companies');
    }

    if (userToApprove.status !== 'PENDING_APPROVAL') {
      throw new ForbiddenException('User is not pending approval');
    }

    const { tempPassword } = await this.processApprovalAndSendEmail(userId, userToApprove.tenant);
    
    return { 
      message: 'Staff approved successfully', 
      tempPassword 
    };
  }

  private async processApprovalAndSendEmail(userId: string, tenant: any) {
    const tempPassword = crypto.randomBytes(6).toString('hex').toUpperCase(); // E.g., 'A1B2C3D4E5F6'
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        requiresPasswordReset: true,
        passwordHash,
      },
    });

    await this.mailService.sendStaffTemporaryPassword(
      user.email,
      user.firstName,
      tempPassword,
      tenant.name,
    );

    return { tempPassword };
  }
}
