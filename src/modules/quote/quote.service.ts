import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteStatus, Prisma } from '@prisma/client';
import { TenancyUtil } from '../../core/shared/utils/tenancy.util';

@Injectable()
export class QuoteService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuote(user: any, createQuoteDto: CreateQuoteDto) {
    // 1. Verify that the customer record belongs to the authorized tenant / franchise network
    const customer = await this.prisma.customerRecord.findUnique({
      where: { id: createQuoteDto.customerRecordId },
      include: { tenant: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer record not found');
    }

    if (!TenancyUtil.isAuthorizedForTenant(user, customer.tenantId, customer.tenant?.parentId)) {
      throw new BadRequestException('You do not have permission to create quotes for this customer');
    }

    const tenantId = customer.tenantId;
    const billingType = createQuoteDto.billingType || 'FIXED';

    // Validate milestone percentages if milestone billing
    if (billingType === 'MILESTONE' && createQuoteDto.milestones && createQuoteDto.milestones.length > 0) {
      const totalPercentage = createQuoteDto.milestones.reduce((sum, m) => sum + Number(m.percentage), 0);
      if (Math.round(totalPercentage) !== 100) {
        throw new BadRequestException(`Milestone percentages must sum up to 100%. Current total: ${totalPercentage}%`);
      }
    }

    // 2. Create the quote and nested milestones if any
    return this.prisma.$transaction(async (tx) => {
      const quote = await tx.quote.create({
        data: {
          tenantId,
          customerRecordId: createQuoteDto.customerRecordId,
          title: createQuoteDto.title,
          amount: createQuoteDto.amount,
          billingType,
          termsAndConditions: createQuoteDto.termsAndConditions || null,
          status: 'DRAFT',
        },
      });

      if (billingType === 'MILESTONE' && createQuoteDto.milestones && createQuoteDto.milestones.length > 0) {
        let order = 1;
        for (const m of createQuoteDto.milestones) {
          await tx.quoteMilestone.create({
            data: {
              quoteId: quote.id,
              tenantId,
              title: m.title,
              percentage: m.percentage,
              amount: m.amount,
              order: m.order || order++,
              dueDate: m.dueDate ? new Date(m.dueDate) : null,
              status: 'PENDING',
            },
          });
        }
      }

      return tx.quote.findUnique({
        where: { id: quote.id },
        include: {
          milestones: { orderBy: { order: 'asc' } },
          customerRecord: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              city: true,
            },
          },
        },
      });
    });
  }

  async getQuotes(
    user: any,
    query?: {
      search?: string;
      status?: QuoteStatus;
      customerRecordId?: string;
      tenantId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? Math.min(query.limit, 100) : 50;
    const skip = (page - 1) * limit;

    const tenantFilter = TenancyUtil.getTenantScopeFilter(user, query?.tenantId);
    const andClauses: any[] = [];

    if (Object.keys(tenantFilter).length > 0) {
      andClauses.push(tenantFilter);
    }

    if (query?.status) {
      andClauses.push({ status: query.status });
    }

    if (query?.customerRecordId) {
      andClauses.push({ customerRecordId: query.customerRecordId });
    }

    if (query?.search && query.search.trim()) {
      const s = query.search.trim();
      andClauses.push({
        OR: [
          { title: { contains: s, mode: 'insensitive' } },
          { id: { contains: s, mode: 'insensitive' } },
          {
            customerRecord: {
              name: { contains: s, mode: 'insensitive' },
            },
          },
          {
            customerRecord: {
              email: { contains: s, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    const where: Prisma.QuoteWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

    const [total, items] = await this.prisma.$transaction([
      this.prisma.quote.count({ where }),
      this.prisma.quote.findMany({
        where,
        include: {
          customerRecord: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              city: true,
            },
          },
          milestones: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              jobs: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getQuote(user: any, quoteId: string) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const where: Prisma.QuoteWhereInput = {
      id: quoteId,
      ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
    };

    const quote = await this.prisma.quote.findFirst({
      where,
      include: {
        customerRecord: true,
        milestones: {
          orderBy: { order: 'asc' },
        },
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found or inaccessible');
    }

    return quote;
  }

  async updateQuote(user: any, quoteId: string, updateQuoteDto: UpdateQuoteDto) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const existing = await this.prisma.quote.findFirst({
      where: {
        id: quoteId,
        ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
      },
      include: { tenant: true },
    });

    if (!existing) {
      throw new NotFoundException('Quote not found or inaccessible');
    }

    const targetTenantId = existing.tenantId;

    if (updateQuoteDto.customerRecordId && updateQuoteDto.customerRecordId !== existing.customerRecordId) {
      const customer = await this.prisma.customerRecord.findUnique({
        where: { id: updateQuoteDto.customerRecordId },
        include: { tenant: true },
      });
      if (!customer || !TenancyUtil.isAuthorizedForTenant(user, customer.tenantId, customer.tenant?.parentId)) {
        throw new BadRequestException('Selected customer does not belong to your authorized scope');
      }
    }

    const billingType = updateQuoteDto.billingType || existing.billingType;

    if (billingType === 'MILESTONE' && updateQuoteDto.milestones && updateQuoteDto.milestones.length > 0) {
      const totalPercentage = updateQuoteDto.milestones.reduce((sum, m) => sum + Number(m.percentage), 0);
      if (Math.round(totalPercentage) !== 100) {
        throw new BadRequestException(`Milestone percentages must sum up to 100%. Current total: ${totalPercentage}%`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.QuoteUpdateInput = {};

      if (updateQuoteDto.title !== undefined) data.title = updateQuoteDto.title;
      if (updateQuoteDto.amount !== undefined) data.amount = updateQuoteDto.amount;
      if (updateQuoteDto.billingType !== undefined) data.billingType = updateQuoteDto.billingType;
      if (updateQuoteDto.status !== undefined) data.status = updateQuoteDto.status;
      if (updateQuoteDto.termsAndConditions !== undefined)
        data.termsAndConditions = updateQuoteDto.termsAndConditions;

      if (updateQuoteDto.customerRecordId !== undefined) {
        data.customerRecord = { connect: { id: updateQuoteDto.customerRecordId } };
      }

      await tx.quote.update({
        where: { id: quoteId },
        data,
      });

      // If milestones updated, replace milestones
      if (updateQuoteDto.milestones !== undefined) {
        await tx.quoteMilestone.deleteMany({ where: { quoteId } });

        if (billingType === 'MILESTONE' && updateQuoteDto.milestones.length > 0) {
          let order = 1;
          for (const m of updateQuoteDto.milestones) {
            await tx.quoteMilestone.create({
              data: {
                quoteId,
                tenantId: targetTenantId,
                title: m.title,
                percentage: m.percentage,
                amount: m.amount,
                order: m.order || order++,
                dueDate: m.dueDate ? new Date(m.dueDate) : null,
                status: 'PENDING',
              },
            });
          }
        }
      }

      return tx.quote.findUnique({
        where: { id: quoteId },
        include: {
          milestones: { orderBy: { order: 'asc' } },
          customerRecord: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              city: true,
            },
          },
        },
      });
    });
  }

  async sendQuote(user: any, quoteId: string) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const quote = await this.prisma.quote.findFirst({
      where: {
        id: quoteId,
        ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found or inaccessible');
    }

    if (quote.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT quotes can be sent');
    }

    return this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'SENT' },
      include: {
        milestones: { orderBy: { order: 'asc' } },
        customerRecord: true,
      },
    });
  }

  async deleteQuote(user: any, quoteId: string) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const quote = await this.prisma.quote.findFirst({
      where: {
        id: quoteId,
        ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found or inaccessible');
    }

    await this.prisma.quote.delete({
      where: { id: quoteId },
    });

    return {
      message: 'Quote deleted successfully',
      id: quoteId,
    };
  }
}
