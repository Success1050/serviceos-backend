import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
export declare class InvoiceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createInvoice(tenantId: string, createInvoiceDto: CreateInvoiceDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        jobId: string | null;
        dueDate: Date | null;
        paidAt: Date | null;
    }>;
    getInvoices(tenantId: string): Promise<({
        customerRecord: {
            name: string;
            email: string | null;
        };
        job: {
            status: import("@prisma/client").$Enums.JobStatus;
            title: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        jobId: string | null;
        dueDate: Date | null;
        paidAt: Date | null;
    })[]>;
    sendInvoice(tenantId: string, invoiceId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        jobId: string | null;
        dueDate: Date | null;
        paidAt: Date | null;
    }>;
    markAsPaid(tenantId: string, invoiceId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        jobId: string | null;
        dueDate: Date | null;
        paidAt: Date | null;
    }>;
}
