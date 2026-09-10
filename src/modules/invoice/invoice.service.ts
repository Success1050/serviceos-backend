import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvoice(tenantId: string, createInvoiceDto: CreateInvoiceDto) {
    // 1. Verify customer record belongs to tenant
    const customer = await this.prisma.customerRecord.findUnique({
      where: { id: createInvoiceDto.customerRecordId },
    });

    if (!customer || customer.tenantId !== tenantId) {
      throw new NotFoundException('Customer record not found for this tenant');
    }

    // 2. Verify job if assigned
    if (createInvoiceDto.jobId) {
      const job = await this.prisma.job.findUnique({
        where: { id: createInvoiceDto.jobId },
      });

      if (!job || job.tenantId !== tenantId) {
        throw new BadRequestException('Invalid job assigned');
      }
    }

    // 3. Create invoice
    return this.prisma.invoice.create({
      data: {
        tenantId,
        title: createInvoiceDto.title,
        amount: createInvoiceDto.amount,
        customerRecordId: createInvoiceDto.customerRecordId,
        jobId: createInvoiceDto.jobId,
        dueDate: createInvoiceDto.dueDate ? new Date(createInvoiceDto.dueDate) : null,
        status: 'DRAFT',
      },
    });
  }

  async getInvoices(tenantId: string) {
    return this.prisma.invoice.findMany({
      where: { tenantId },
      include: {
        customerRecord: {
          select: { name: true, email: true }
        },
        job: {
          select: { title: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendInvoice(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice || invoice.tenantId !== tenantId) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT invoices can be sent');
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'SENT' },
    });
  }

  async markAsPaid(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice || invoice.tenantId !== tenantId) {
      throw new NotFoundException('Invoice not found');
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { 
        status: 'PAID',
        paidAt: new Date(),
      },
    });
  }
}
