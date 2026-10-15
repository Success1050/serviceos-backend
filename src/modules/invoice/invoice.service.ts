import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { InvoiceStatus, PaymentGatewayType, PaymentTransactionStatus, Prisma } from '@prisma/client';
import { TenancyUtil } from '../../core/shared/utils/tenancy.util';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvoice(user: any, createInvoiceDto: CreateInvoiceDto) {
    // 1. Verify customer record belongs to tenant / franchise network
    const customer = await this.prisma.customerRecord.findUnique({
      where: { id: createInvoiceDto.customerRecordId },
      include: { tenant: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer record not found');
    }

    if (!TenancyUtil.isAuthorizedForTenant(user, customer.tenantId, customer.tenant?.parentId)) {
      throw new BadRequestException('You do not have permission to create invoices for this customer');
    }

    const tenantId = customer.tenantId;

    // 2. Verify job if assigned
    if (createInvoiceDto.jobId) {
      const job = await this.prisma.job.findUnique({
        where: { id: createInvoiceDto.jobId },
      });

      if (!job || job.tenantId !== tenantId) {
        throw new BadRequestException('Invalid job assigned for this tenant');
      }
    }

    // 3. Create invoice
    return this.prisma.invoice.create({
      data: {
        tenantId,
        title: createInvoiceDto.title,
        amount: createInvoiceDto.amount,
        customerRecordId: createInvoiceDto.customerRecordId,
        jobId: createInvoiceDto.jobId || null,
        dueDate: createInvoiceDto.dueDate ? new Date(createInvoiceDto.dueDate) : null,
        status: InvoiceStatus.DRAFT,
      },
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
        job: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Day 8: 1-Click "Convert Quote to Invoice" workflow
   */
  async convertQuoteToInvoice(user: any, quoteId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        customerRecord: true,
        tenant: true,
        milestones: { orderBy: { order: 'asc' } },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (!TenancyUtil.isAuthorizedForTenant(user, quote.tenantId, quote.tenant?.parentId)) {
      throw new BadRequestException('You do not have permission to convert this quote');
    }

    // Set default due date to 14 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the new invoice
      const invoice = await tx.invoice.create({
        data: {
          tenantId: quote.tenantId,
          title: `Invoice for ${quote.title}`,
          amount: quote.amount,
          customerRecordId: quote.customerRecordId,
          dueDate,
          status: InvoiceStatus.SENT,
        },
      });

      // 2. If quote was in DRAFT, transition to ACCEPTED
      if (quote.status === 'DRAFT' || quote.status === 'SENT') {
        await tx.quote.update({
          where: { id: quote.id },
          data: { status: 'ACCEPTED' },
        });
      }

      return tx.invoice.findUnique({
        where: { id: invoice.id },
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
          job: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });
    });
  }

  async getInvoices(
    user: any,
    query?: {
      search?: string;
      status?: InvoiceStatus;
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
          { customerRecord: { name: { contains: s, mode: 'insensitive' } } },
          { customerRecord: { email: { contains: s, mode: 'insensitive' } } },
          { customerRecord: { phone: { contains: s, mode: 'insensitive' } } },
        ],
      });
    }

    const where: Prisma.InvoiceWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

    const [total, items] = await this.prisma.$transaction([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
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
          job: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          paymentTransactions: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // Financial Metrics Calculation
    const allInScopeInvoices = await this.prisma.invoice.findMany({
      where: Object.keys(tenantFilter).length > 0 ? tenantFilter : {},
      select: {
        amount: true,
        status: true,
        dueDate: true,
      },
    });

    let totalBilled = 0;
    let paidAmount = 0;
    let outstandingAmount = 0;
    let overdueCount = 0;
    let paidCount = 0;

    const now = new Date();
    for (const inv of allInScopeInvoices) {
      const val = Number(inv.amount) || 0;
      totalBilled += val;

      if (inv.status === InvoiceStatus.PAID) {
        paidAmount += val;
        paidCount++;
      } else if (inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.PARTIALLY_PAID) {
        outstandingAmount += val;
        if (inv.dueDate && new Date(inv.dueDate) < now) {
          overdueCount++;
        }
      } else if (inv.status === InvoiceStatus.OVERDUE) {
        outstandingAmount += val;
        overdueCount++;
      }
    }

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      metrics: {
        totalBilled,
        paidAmount,
        outstandingAmount,
        overdueCount,
        paidCount,
      },
    };
  }

  async getInvoice(user: any, invoiceId: string) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const where: Prisma.InvoiceWhereInput = {
      id: invoiceId,
      ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
    };

    const invoice = await this.prisma.invoice.findFirst({
      where,
      include: {
        customerRecord: true,
        job: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            settings: true,
          },
        },
        paymentTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found or inaccessible');
    }

    return invoice;
  }

  async sendInvoice(user: any, invoiceId: string) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found or inaccessible');
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.SENT },
      include: {
        customerRecord: true,
      },
    });
  }

  /**
   * Day 8: Manual Payment Recording (Bank Transfer / Cash / POS)
   */
  async recordPayment(user: any, invoiceId: string, recordPaymentDto: RecordPaymentDto) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
      },
      include: {
        paymentTransactions: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found or inaccessible');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('This invoice is already paid in full');
    }

    const paymentAmount = Number(recordPaymentDto.amount);
    if (paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    // Generate reference
    const ref =
      recordPaymentDto.reference?.trim() ||
      `MAN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create successful transaction record
      await tx.paymentTransaction.create({
        data: {
          tenantId: invoice.tenantId,
          customerRecordId: invoice.customerRecordId,
          invoiceId: invoice.id,
          gateway: PaymentGatewayType.PAYSTACK,
          transactionReference: ref,
          gatewayReference: ref,
          amount: paymentAmount,
          currency: 'NGN',
          type: 'DIRECT_CHARGE',
          paymentMethod: recordPaymentDto.paymentMethod || 'BANK_TRANSFER',
          status: PaymentTransactionStatus.SUCCESSFUL,
          metadata: {
            bankName: recordPaymentDto.bankName || null,
            tellerSlipUrl: recordPaymentDto.tellerSlipUrl || null,
            notes: recordPaymentDto.notes || null,
            recordedBy: user.email || 'Admin',
            paidAt: recordPaymentDto.paidAt || new Date().toISOString(),
          },
        },
      });

      // 2. Sum up existing and new successful payments
      const priorPaid = invoice.paymentTransactions
        .filter((t) => t.status === PaymentTransactionStatus.SUCCESSFUL)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalPaid = priorPaid + paymentAmount;
      const invoiceTotal = Number(invoice.amount);

      let newStatus: InvoiceStatus = InvoiceStatus.PARTIALLY_PAID;
      let paidAtDate: Date | null = null;

      if (totalPaid >= invoiceTotal) {
        newStatus = InvoiceStatus.PAID;
        paidAtDate = new Date();
      }

      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: newStatus,
          paidAt: paidAtDate || invoice.paidAt,
        },
        include: {
          customerRecord: true,
          paymentTransactions: { orderBy: { createdAt: 'desc' } },
        },
      });
    });
  }

  /**
   * Day 8: Initiate Multi-Gateway Online Checkout (Paystack / Stripe)
   */
  async payInvoice(user: any, invoiceId: string, payDto: PayInvoiceDto) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
      },
      include: {
        customerRecord: true,
        tenant: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found or inaccessible');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('This invoice is already paid in full');
    }

    const gateway = payDto.gateway === 'STRIPE' ? PaymentGatewayType.STRIPE : PaymentGatewayType.PAYSTACK;
    const currency = payDto.currency || (gateway === PaymentGatewayType.STRIPE ? 'USD' : 'NGN');
    const reference = `ONLINE-${gateway}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create a pending transaction record
    await this.prisma.paymentTransaction.create({
      data: {
        tenantId: invoice.tenantId,
        customerRecordId: invoice.customerRecordId,
        invoiceId: invoice.id,
        gateway,
        transactionReference: reference,
        amount: invoice.amount,
        currency,
        type: 'DIRECT_CHARGE',
        paymentMethod: 'CARD',
        status: PaymentTransactionStatus.PENDING,
        metadata: {
          customerEmail: invoice.customerRecord.email,
          customerName: invoice.customerRecord.name,
          invoiceTitle: invoice.title,
        },
      },
    });

    return {
      message: 'Payment gateway initialized',
      gateway,
      reference,
      amount: Number(invoice.amount),
      currency,
      customerEmail: invoice.customerRecord.email,
      customerName: invoice.customerRecord.name,
      // Public sandbox test keys for checkout demo
      publicKey:
        gateway === PaymentGatewayType.PAYSTACK
          ? process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_demo_paystack_serviceos_2026'
          : process.env.STRIPE_PUBLIC_KEY || 'pk_test_demo_stripe_serviceos_2026',
    };
  }

  async markAsPaid(user: any, invoiceId: string) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found or inaccessible');
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
      include: {
        customerRecord: true,
      },
    });
  }

  async updateInvoice(user: any, invoiceId: string, updateDto: Partial<CreateInvoiceDto>) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found or inaccessible');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot modify a fully paid invoice');
    }

    const data: Prisma.InvoiceUpdateInput = {};
    if (updateDto.title) data.title = updateDto.title;
    if (updateDto.amount !== undefined) data.amount = updateDto.amount;
    if (updateDto.dueDate) data.dueDate = new Date(updateDto.dueDate);

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data,
      include: {
        customerRecord: true,
      },
    });
  }

  async deleteInvoice(user: any, invoiceId: string) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found or inaccessible');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Paid invoices cannot be deleted for accounting audit compliance');
    }

    await this.prisma.invoice.delete({
      where: { id: invoiceId },
    });

    return {
      message: 'Invoice deleted successfully',
      id: invoiceId,
    };
  }
}
