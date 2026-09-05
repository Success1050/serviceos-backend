import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
export declare class InvoiceController {
    private readonly invoiceService;
    constructor(invoiceService: InvoiceService);
    create(user: any, createInvoiceDto: CreateInvoiceDto): Promise<{
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
    findAll(user: any): Promise<({
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
    send(user: any, invoiceId: string): Promise<{
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
    markAsPaid(user: any, invoiceId: string): Promise<{
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
