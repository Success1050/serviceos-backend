import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

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
      const tenant = await tx.tenant.create({
        data: {
          name: createTenantDto.name,
          slug: createTenantDto.slug,
          settings: {
            create: {
              businessProfile: { companyName: createTenantDto.name },
              branding: {},
              portal: { enabled: true, welcomeMessage: `Welcome to ${createTenantDto.name}` },
            },
          },
        },
        include: {
          settings: true,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          tenantId: tenant.id,
          role: 'TENANT_OWNER',
        },
      });

      return tenant;
    });

    return result;
  }

  async getTenantBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        settings: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }
}
