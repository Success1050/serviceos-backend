import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { TokenUtil } from '../../core/shared/utils/token.util';
import { TenancyUtil } from '../../core/shared/utils/tenancy.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async createCustomer(user: any, createCustomerDto: CreateCustomerDto) {
    let targetTenantId = user.tenantId;

    if (!targetTenantId) {
      if (createCustomerDto.tenantId) {
        targetTenantId = createCustomerDto.tenantId;
      } else {
        // Fallback for platform SuperAdmin creating a customer: use the first active tenant in DB
        const fallbackTenant = await this.prisma.tenant.findFirst({
          orderBy: { createdAt: 'asc' },
        });
        if (!fallbackTenant) {
          throw new BadRequestException('No active tenant found to associate customer with');
        }
        targetTenantId = fallbackTenant.id;
      }
    } else if (createCustomerDto.tenantId && createCustomerDto.tenantId !== user.tenantId) {
      // If HQ, can create under a subcompany
      const targetTenant = await this.prisma.tenant.findUnique({
        where: { id: createCustomerDto.tenantId },
      });
      if (
        !targetTenant ||
        !TenancyUtil.isAuthorizedForTenant(user, targetTenant.id, targetTenant.parentId)
      ) {
        throw new BadRequestException('Unauthorized to create customer in specified tenant');
      }
      targetTenantId = targetTenant.id;
    }

    // 1. Create the base CRM record for the business
    const customer = await this.prisma.customerRecord.create({
      data: {
        tenantId: targetTenantId,
        name: createCustomerDto.name,
        email: createCustomerDto.email,
        phone: createCustomerDto.phone,
        address: createCustomerDto.address,
        city: createCustomerDto.city,
      },
    });

    return customer;
  }

  async inviteCustomer(user: any, customerRecordId: string) {
    // 1. Verify customer record belongs to tenant or franchise scope
    const customerRecord = await this.prisma.customerRecord.findUnique({
      where: { id: customerRecordId },
      include: { tenant: true },
    });

    if (!customerRecord) {
      throw new NotFoundException('Customer record not found');
    }

    if (!TenancyUtil.isAuthorizedForTenant(user, customerRecord.tenantId, customerRecord.tenant?.parentId)) {
      throw new BadRequestException('Unauthorized to invite this customer');
    }

    const tenantId = customerRecord.tenantId;

    // 2. Upsert CustomerTenantRelationship
    let relationship = await this.prisma.customerTenantRelationship.findUnique({
      where: {
        tenantId_customerRecordId: {
          tenantId,
          customerRecordId,
        },
      },
    });

    if (!relationship) {
      relationship = await this.prisma.customerTenantRelationship.create({
        data: {
          tenantId,
          customerRecordId,
          status: 'INVITATION_PENDING',
        },
      });
    }

    // 3. Generate Secure Token
    const plainToken = TokenUtil.generateSecureToken();
    const tokenHash = TokenUtil.hashToken(plainToken);

    // 4. Create Invitation Record (expires in 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.invitation.create({
      data: {
        tokenHash,
        relationshipId: relationship.id,
        status: 'PENDING',
        expiresAt,
      },
    });

    // 5. Return Invitation details
    return {
      message: 'Invitation generated successfully',
      plainToken,
      expiresAt,
    };
  }

  async getCustomers(
    user: any,
    query?: { search?: string; status?: string; tenantId?: string; page?: number; limit?: number },
  ) {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const tenantFilter = TenancyUtil.getTenantScopeFilter(user, query?.tenantId);
    const andClauses: any[] = [];

    if (Object.keys(tenantFilter).length > 0) {
      andClauses.push(tenantFilter);
    }

    if (query?.search && query.search.trim()) {
      const s = query.search.trim();
      andClauses.push({
        OR: [
          { name: { contains: s, mode: 'insensitive' } },
          { email: { contains: s, mode: 'insensitive' } },
          { phone: { contains: s, mode: 'insensitive' } },
          { city: { contains: s, mode: 'insensitive' } },
        ],
      });
    }

    if (query?.status && query.status !== 'ALL') {
      if (query.status === 'NOT_ACTIVATED') {
        andClauses.push({
          OR: [
            { relationships: { none: {} } },
            { relationships: { some: { status: 'NOT_ACTIVATED' } } },
          ],
        });
      } else {
        andClauses.push({
          relationships: {
            some: {
              status: query.status,
            },
          },
        });
      }
    }

    const where: Prisma.CustomerRecordWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

    const [total, items] = await Promise.all([
      this.prisma.customerRecord.count({ where }),
      this.prisma.customerRecord.findMany({
        where,
        include: {
          relationships: {
            select: {
              id: true,
              status: true,
              identityId: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              quotes: true,
              jobs: true,
              invoices: true,
              assets: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const customers = items.map((item) => {
      const activeRel = item.relationships.find((r) => r.status === 'ACTIVE');
      const pendingRel = item.relationships.find((r) => r.status === 'INVITATION_PENDING');
      const rel = activeRel || pendingRel || item.relationships[0];
      const portalStatus = rel?.status || 'NOT_ACTIVATED';
      return {
        ...item,
        portalStatus,
        relationshipId: rel?.id,
      };
    });

    return {
      items: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomer(user: any, customerId: string) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const where: Prisma.CustomerRecordWhereInput = {
      id: customerId,
      ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
    };

    const customer = await this.prisma.customerRecord.findFirst({
      where,
      include: {
        relationships: true,
        quotes: { orderBy: { createdAt: 'desc' }, take: 10 },
        jobs: { orderBy: { createdAt: 'desc' }, take: 10 },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        assets: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer record not found or inaccessible');
    }

    const activeRel = customer.relationships.find((r) => r.status === 'ACTIVE');
    const pendingRel = customer.relationships.find((r) => r.status === 'INVITATION_PENDING');
    const rel = activeRel || pendingRel || customer.relationships[0];
    return {
      ...customer,
      portalStatus: rel?.status || 'NOT_ACTIVATED',
      relationshipId: rel?.id,
    };
  }
}
