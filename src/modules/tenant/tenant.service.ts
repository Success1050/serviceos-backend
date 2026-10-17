import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { MailService } from '../../core/mail/mail.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async createTenant(createTenantDto: CreateTenantDto, ownerId: string) {
    // Check if slug already exists
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: createTenantDto.slug },
    });

    if (existing) {
      throw new ConflictException('Tenant slug is already taken');
    }

    // Verify user exists and doesn't already have a tenant
    const user = await this.prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!user) {
      throw new NotFoundException('Owner user not found');
    }

    if (user.tenantId) {
      throw new ConflictException('User already belongs to a tenant');
    }

    // Create Tenant, initialize settings, and assign owner in one transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const isHq = Boolean(createTenantDto.isHq);
      const parentId = createTenantDto.parentId || null;

      const tenant = await tx.tenant.create({
        data: {
          name: createTenantDto.name,
          slug: createTenantDto.slug,
          parentId,
          settings: {
            create: {
              businessProfile: {
                companyName: createTenantDto.name,
                industry: createTenantDto.industry || 'Solar & Energy',
                phone: createTenantDto.phone || null,
                address: createTenantDto.address || null,
                currency: createTenantDto.currency || 'NGN',
                taxRate: createTenantDto.taxRate ?? 7.5,
                timezone: createTenantDto.timezone || 'Africa/Lagos',
                isHq,
                entityType: isHq ? 'FRANCHISE_HQ' : parentId ? 'SUB_COMPANY' : 'SINGLE',
              },
              branding: {},
              portal: { enabled: true, welcomeMessage: `Welcome to ${createTenantDto.name}` },
            },
          },
        },
        include: {
          settings: true,
          children: true,
        },
      });

      // Role assignment: HQ_ADMIN if Corporate Franchise HQ, otherwise TENANT_OWNER
      const roleName = isHq ? 'HQ_ADMIN' : 'TENANT_OWNER';
      let assignedRole = await tx.role.findFirst({
        where: { name: roleName, tenantId: tenant.id },
      });
      if (!assignedRole) {
        assignedRole = await tx.role.create({
          data: {
            name: roleName,
            permissions: ['*'],
            tenantId: tenant.id,
          },
        });
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          tenantId: tenant.id,
          roleId: assignedRole.id,
          directPermissions: isHq ? ['admin_access', 'view_hq_analytics'] : ['admin_access'],
        },
      });

      // If HQ specified an initial sub-company/branch, auto-provision it
      if (isHq && createTenantDto.initialBranchName) {
        const branchClean = createTenantDto.initialBranchName
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        const branchSlug = `${tenant.slug}-${branchClean || 'branch-1'}`;

        await tx.tenant.create({
          data: {
            name: createTenantDto.initialBranchName,
            slug: branchSlug,
            parentId: tenant.id,
            settings: {
              create: {
                businessProfile: {
                  companyName: createTenantDto.initialBranchName,
                  industry: createTenantDto.industry || 'Solar & Energy',
                  entityType: 'SUB_COMPANY',
                },
                branding: {},
                portal: { enabled: true, welcomeMessage: `Welcome to ${createTenantDto.initialBranchName}` },
              },
            },
          },
        });
      }

      // Auto-assign default subscription tier: Enterprise for HQ, Growth for standalone
      const targetSlug = isHq ? 'enterprise' : 'growth';
      const defaultPlan = await tx.subscriptionPlan.findUnique({
        where: { slug: targetSlug },
      });

      if (defaultPlan) {
        const periodEnd = new Date();
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        await tx.tenantSubscription.create({
          data: {
            tenantId: tenant.id,
            planId: defaultPlan.id,
            status: 'ACTIVE',
            billingCycle: 'ANNUAL',
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          },
        });
      }

      return tenant;
    });

    return result;
  }

  async checkSlugAvailability(slug: string): Promise<{ available: boolean; slug: string }> {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true },
    });
    return {
      available: !existing,
      slug: slug.toLowerCase(),
    };
  }

  async createSubCompany(parentId: string, createTenantDto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: createTenantDto.slug },
    });

    if (existing) {
      throw new ConflictException('Tenant slug is already taken');
    }

    const parent = await this.prisma.tenant.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException('Parent tenant not found');
    }

    // Create Child Tenant linked to Parent
    const tenant = await this.prisma.tenant.create({
      data: {
        name: createTenantDto.name,
        slug: createTenantDto.slug,
        parentId: parent.id,
        settings: {
          create: {
            businessProfile: {
              companyName: createTenantDto.name,
              industry: createTenantDto.industry || 'Solar & Energy',
              entityType: 'SUB_COMPANY',
            },
            branding: {},
            portal: { enabled: true, welcomeMessage: `Welcome to ${createTenantDto.name}` },
          },
        },
      },
      include: {
        settings: true,
      },
    });

    // Ensure TENANT_OWNER role exists for this new subcompany branch
    let ownerRole = await this.prisma.role.findFirst({
      where: { name: 'TENANT_OWNER', tenantId: tenant.id },
    });
    if (!ownerRole) {
      ownerRole = await this.prisma.role.create({
        data: {
          name: 'TENANT_OWNER',
          permissions: ['*'],
          tenantId: tenant.id,
        },
      });
    }

    let managerCredentials: { email: string; tempPassword: string } | null = null;

    // If a branch manager email is provided, create the account and send the welcome email with temp password
    if (createTenantDto.managerEmail) {
      const tempPassword = crypto.randomBytes(6).toString('hex').toUpperCase(); // e.g. 'A1B2C3D4E5F6'
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(tempPassword, salt);

      await this.prisma.user.upsert({
        where: { email: createTenantDto.managerEmail },
        update: {
          passwordHash,
          tenantId: tenant.id,
          roleId: ownerRole.id,
          status: 'ACTIVE',
          requiresPasswordReset: true,
        },
        create: {
          email: createTenantDto.managerEmail,
          firstName: createTenantDto.managerName || 'Branch',
          lastName: 'Manager',
          passwordHash,
          tenantId: tenant.id,
          roleId: ownerRole.id,
          status: 'ACTIVE',
          requiresPasswordReset: true,
        },
      });

      // Send the activation email with temporary password
      try {
        await this.mailService.sendStaffTemporaryPassword(
          createTenantDto.managerEmail,
          createTenantDto.managerName || 'Branch Manager',
          tempPassword,
          tenant.name,
        );
      } catch (err) {
        // Fallback logger is handled in mailService, ensure creation doesn't crash in local dev
      }

      managerCredentials = {
        email: createTenantDto.managerEmail,
        tempPassword,
      };
    }

    return {
      ...tenant,
      manager: managerCredentials,
    };
  }

  async getTenantBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        settings: true,
        parent: {
          include: { settings: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Cascade HQ locked settings to sub-company if applicable
    if (tenant.parent?.settings && tenant.settings) {
      const parentSettings = tenant.parent.settings;
      const lockedFields = Array.isArray(parentSettings.lockedSettings)
        ? (parentSettings.lockedSettings as any as string[])
        : [];

      lockedFields.forEach((field: string) => {
        if ((parentSettings as any)[field] !== undefined) {
          (tenant.settings as any)[field] = (parentSettings as any)[field];
        }
      });

      // If child branch has no custom branding, inherit parent HQ branding
      const childBranding = tenant.settings.branding as Record<string, any> | null;
      if (parentSettings.branding && (!childBranding || !childBranding.primaryColor)) {
        tenant.settings.branding = parentSettings.branding;
      }
    }

    return tenant;
  }
}
