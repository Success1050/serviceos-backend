import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';
import { MailService } from '../../core/mail/mail.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteStatus, Prisma } from '@prisma/client';
import { TenancyUtil } from '../../core/shared/utils/tenancy.util';

interface QuotePricingMeta {
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    category?: string;
  }>;
  subtotal?: number;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  taxAmount?: number;
  validUntil?: string;
  notes?: string;
}

const META_PREFIX = '<!--serviceos-quote-meta:';
const META_SUFFIX = '-->';

function packTermsWithMeta(terms?: string, meta?: QuotePricingMeta): string | null {
  const cleanTerms = terms || '';
  if (!meta || (!meta.items?.length && !meta.validUntil && !meta.taxAmount && !meta.discountAmount)) {
    return cleanTerms || null;
  }
  const metaJson = JSON.stringify(meta);
  return `${cleanTerms}\n\n${META_PREFIX}${metaJson}${META_SUFFIX}`.trim();
}

function unpackTermsWithMeta(rawTerms?: string | null): { termsAndConditions?: string | null; meta?: QuotePricingMeta } {
  if (!rawTerms) return { termsAndConditions: null };
  const startIndex = rawTerms.indexOf(META_PREFIX);
  if (startIndex === -1) {
    return { termsAndConditions: rawTerms };
  }
  const endIndex = rawTerms.indexOf(META_SUFFIX, startIndex);
  if (endIndex === -1) {
    return { termsAndConditions: rawTerms };
  }

  const cleanTerms = rawTerms.slice(0, startIndex).trim();
  const jsonStr = rawTerms.slice(startIndex + META_PREFIX.length, endIndex);
  try {
    const meta = JSON.parse(jsonStr) as QuotePricingMeta;
    return { termsAndConditions: cleanTerms || null, meta };
  } catch {
    return { termsAndConditions: rawTerms };
  }
}

function formatQuoteResponse(quote: any): any {
  if (!quote) return quote;
  const { termsAndConditions, meta } = unpackTermsWithMeta(quote.termsAndConditions);
  return {
    ...quote,
    termsAndConditions,
    items: meta?.items || undefined,
    subtotal: meta?.subtotal || undefined,
    discountAmount: meta?.discountAmount || undefined,
    taxAmount: meta?.taxAmount || undefined,
    validUntil: meta?.validUntil || undefined,
    notes: meta?.notes || undefined,
  };
}

@Injectable()
export class QuoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}


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
    const meta: QuotePricingMeta = {
      items: createQuoteDto.items,
      subtotal: createQuoteDto.subtotal,
      discountAmount: createQuoteDto.discountAmount,
      taxAmount: createQuoteDto.taxAmount,
      validUntil: createQuoteDto.validUntil,
      notes: createQuoteDto.notes,
    };
    const packedTerms = packTermsWithMeta(createQuoteDto.termsAndConditions, meta);

    const created = await this.prisma.$transaction(async (tx) => {
      const quote = await tx.quote.create({
        data: {
          tenantId,
          customerRecordId: createQuoteDto.customerRecordId,
          title: createQuoteDto.title,
          amount: createQuoteDto.amount,
          billingType,
          termsAndConditions: packedTerms,
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

    return formatQuoteResponse(created);
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
      items: items.map((q) => formatQuoteResponse(q)),
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

    return formatQuoteResponse(quote);
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

    let packedTerms: string | null | undefined = updateQuoteDto.termsAndConditions;
    if (
      updateQuoteDto.items !== undefined ||
      updateQuoteDto.validUntil !== undefined ||
      updateQuoteDto.discountAmount !== undefined ||
      updateQuoteDto.taxAmount !== undefined
    ) {
      const { termsAndConditions: baseTerms, meta: oldMeta } = unpackTermsWithMeta(
        updateQuoteDto.termsAndConditions !== undefined
          ? updateQuoteDto.termsAndConditions
          : existing.termsAndConditions,
      );
      const newMeta: QuotePricingMeta = {
        ...oldMeta,
        items: updateQuoteDto.items !== undefined ? updateQuoteDto.items : oldMeta?.items,
        subtotal: updateQuoteDto.subtotal !== undefined ? updateQuoteDto.subtotal : oldMeta?.subtotal,
        discountAmount:
          updateQuoteDto.discountAmount !== undefined ? updateQuoteDto.discountAmount : oldMeta?.discountAmount,
        taxAmount: updateQuoteDto.taxAmount !== undefined ? updateQuoteDto.taxAmount : oldMeta?.taxAmount,
        validUntil: updateQuoteDto.validUntil !== undefined ? updateQuoteDto.validUntil : oldMeta?.validUntil,
        notes: updateQuoteDto.notes !== undefined ? updateQuoteDto.notes : oldMeta?.notes,
      };
      packedTerms = packTermsWithMeta(baseTerms || undefined, newMeta);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.QuoteUpdateInput = {};

      if (updateQuoteDto.title !== undefined) data.title = updateQuoteDto.title;
      if (updateQuoteDto.amount !== undefined) data.amount = updateQuoteDto.amount;
      if (updateQuoteDto.billingType !== undefined) data.billingType = updateQuoteDto.billingType;
      if (updateQuoteDto.status !== undefined) data.status = updateQuoteDto.status;
      if (packedTerms !== undefined) data.termsAndConditions = packedTerms;

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

    return formatQuoteResponse(updated);
  }

  async sendQuote(user: any, quoteId: string) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const quote = await this.prisma.quote.findFirst({
      where: {
        id: quoteId,
        ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
      },
      include: {
        tenant: true,
        customerRecord: true,
        milestones: { orderBy: { order: 'asc' } },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found or inaccessible');
    }

    if (quote.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT quotes can be sent');
    }

    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'SENT' },
      include: {
        milestones: { orderBy: { order: 'asc' } },
        customerRecord: true,
        tenant: true,
      },
    });

    // Send notification email to customer if email is configured
    if (updated.customerRecord?.email) {
      const frontendBaseUrl = (
        this.configService?.get<string>('FRONTEND_URL') ||
        process.env.FRONTEND_URL ||
        'http://localhost:3000'
      ).replace(/\/+$/, '');
      const portalSlug = updated.tenant?.slug || 'portal';
      const portalUrl = `${frontendBaseUrl}/s/${portalSlug}/quotes/${quote.id}`;

      try {
        await this.mailService.sendQuoteEmail({
          to: updated.customerRecord.email,
          customerName: updated.customerRecord.name,
          companyName: updated.tenant?.name || 'ServiceOS Contractor',
          quoteTitle: updated.title,
          amount: Number(updated.amount),
          portalUrl,
        });
      } catch (err: any) {
        console.warn(`Could not dispatch quote email to ${updated.customerRecord.email}:`, err?.message);
      }
    }

    return formatQuoteResponse(updated);
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
