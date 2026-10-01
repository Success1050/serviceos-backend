import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { FilterSuperAdminTenantsDto } from '../dto/filter-superadmin-tenants.dto';
import { UpdateTenantStatusDto } from '../dto/update-tenant-status.dto';

@Injectable()
export class SuperAdminTenantService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenants(filter: FilterSuperAdminTenantsDto) {
    const where: any = {};

    if (filter.isParentOnly) {
      where.parentId = null;
    }

    if (typeof filter.isSuspended === 'boolean') {
      where.isSuspended = filter.isSuspended;
    }

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { slug: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.planTier) {
      where.subscription = {
        plan: {
          tier: filter.planTier,
        },
      };
    }

    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const skip = (page - 1) * limit;

    const [tenants, totalCount] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
          settings: true,
          users: {
            where: {
              role: {
                name: { in: ['TENANT_OWNER', 'TENANT_ADMIN', 'Owner', 'Admin'] },
              },
            },
            take: 1,
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          children: {
            include: {
              subscription: {
                include: {
                  plan: true,
                },
              },
              users: {
                select: {
                  id: true,
                  isFieldTech: true,
                },
              },
              jobs: {
                where: {
                  status: { in: ['SCHEDULED', 'EN_ROUTE', 'IN_PROGRESS'] },
                },
                select: { id: true },
              },
              invoices: {
                where: { status: 'PAID' },
                select: { amount: true },
              },
            },
          },
          _count: {
            select: {
              users: true,
              jobs: true,
              invoices: true,
              children: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    // Format response with hierarchy metrics
    const formatted = tenants.map((tenant) => {
      const owner = tenant.users[0] || null;
      const subCompanies = tenant.children.map((child) => {
        const branchTechCount = child.users.filter((u) => u.isFieldTech).length;
        const branchActiveJobs = child.jobs.length;
        const branchRevenue = child.invoices.reduce(
          (sum, inv) => sum + Number(inv.amount || 0),
          0,
        );

        return {
          id: child.id,
          name: child.name,
          slug: child.slug,
          status: child.isSuspended ? 'SUSPENDED' : 'ACTIVE',
          techniciansCount: branchTechCount,
          activeJobsCount: branchActiveJobs,
          monthlyRevenue: branchRevenue,
          plan: child.subscription?.plan?.tier || tenant.subscription?.plan?.tier || 'STARTER',
          createdAt: child.createdAt,
        };
      });

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        parentId: tenant.parentId,
        status: tenant.isSuspended ? 'SUSPENDED' : 'ACTIVE',
        suspensionReason: tenant.suspensionReason,
        plan: tenant.subscription?.plan?.tier || 'STARTER',
        subscription: tenant.subscription,
        owner: owner
          ? {
              id: owner.id,
              name: `${owner.firstName} ${owner.lastName}`,
              email: owner.email,
              phone: owner.phone,
            }
          : null,
        stats: {
          totalUsers: tenant._count.users,
          totalJobs: tenant._count.jobs,
          totalInvoices: tenant._count.invoices,
          subCompaniesCount: tenant._count.children,
        },
        subCompanies,
        createdAt: tenant.createdAt,
      };
    });

    return {
      data: formatted,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getTenantById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        parent: {
          include: {
            subscription: {
              include: { plan: true },
            },
          },
        },
        children: {
          include: {
            subscription: {
              include: { plan: true },
            },
            _count: {
              select: { users: true, jobs: true },
            },
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
        settings: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isFieldTech: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            users: true,
            jobs: true,
            invoices: true,
            quotes: true,
            assets: true,
            warehouses: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateTenantStatus(
    id: string,
    dto: UpdateTenantStatusDto,
    superAdminUserId: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const t = await tx.tenant.update({
        where: { id },
        data: {
          isSuspended: dto.isSuspended,
          suspensionReason: dto.isSuspended ? dto.suspensionReason || 'Suspended by SuperAdmin' : null,
        },
      });

      if (dto.cascadeToBranches && tenant.children.length > 0) {
        await tx.tenant.updateMany({
          where: { parentId: id },
          data: {
            isSuspended: dto.isSuspended,
            suspensionReason: dto.isSuspended
              ? `Cascaded suspension from parent corporate HQ: ${dto.suspensionReason || ''}`
              : null,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: superAdminUserId,
          tenantId: id,
          action: dto.isSuspended ? 'SUPERADMIN_SUSPEND_TENANT' : 'SUPERADMIN_ACTIVATE_TENANT',
          entityType: 'TENANT',
          entityId: id,
          details: {
            targetTenantId: id,
            targetTenantName: tenant.name,
            reason: dto.suspensionReason,
            cascadeToBranches: Boolean(dto.cascadeToBranches),
          },
        },
      });

      return t;
    });

    return {
      success: true,
      tenantId: updated.id,
      isSuspended: updated.isSuspended,
      suspensionReason: updated.suspensionReason,
    };
  }
}
