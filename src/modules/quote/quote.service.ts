import { Injectable, NotFoundException } from '@nestjs/common';
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

    // 2. Create the quote
    const quote = await this.prisma.quote.create({
      data: {
        tenantId,
        customerRecordId: createQuoteDto.customerRecordId,
        title: createQuoteDto.title,
        amount: createQuoteDto.amount,
        status: 'DRAFT',
      },
    });

    return quote;
  }

  async getQuotes(tenantId: string) {
    return this.prisma.quote.findMany({
      where: { tenantId },
      include: {
        customerRecord: {
          select: {
            name: true,
            email: true,
          }
        }
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
      throw new Error('Only DRAFT quotes can be sent');
    }

    return this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'SENT' },
    });
  }
}
