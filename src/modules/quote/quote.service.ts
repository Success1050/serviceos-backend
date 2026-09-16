import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuoteService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuote(tenantId: string, createQuoteDto: CreateQuoteDto) {
    // 1. Verify that the customer record belongs to this tenant
    const customer = await this.prisma.customerRecord.findUnique({
      where: { id: createQuoteDto.customerRecordId },
    });

    if (!customer || customer.tenantId !== tenantId) {
      throw new NotFoundException('Customer record not found for this tenant');
    }

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
            select: { name: true, email: true },
          },
        },
      });
    });
  }

  async getQuotes(tenantId: string) {
    return this.prisma.quote.findMany({
      where: { tenantId },
      include: {
        customerRecord: {
          select: {
            name: true,
            email: true,
          },
        },
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendQuote(tenantId: string, quoteId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote || quote.tenantId !== tenantId) {
      throw new NotFoundException('Quote not found for this tenant');
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
}
