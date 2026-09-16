import { QuoteService } from './quote.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
export declare class QuoteController {
    private readonly quoteService;
    constructor(quoteService: QuoteService);
    create(user: any, createQuoteDto: CreateQuoteDto): Promise<({
        customerRecord: {
            name: string;
            email: string | null;
        };
        milestones: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.MilestoneStatus;
            tenantId: string;
            title: string;
            percentage: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal;
            order: number;
            dueDate: Date | null;
            quoteId: string;
            invoiceId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        tenantId: string;
        customerRecordId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        billingType: import("@prisma/client").$Enums.BillingType;
        termsAndConditions: string | null;
        signedTermsAt: Date | null;
        signerName: string | null;
        signerIp: string | null;
        signatureData: string | null;
    }) | null>;
    findAll(user: any): Promise<({
        customerRecord: {
            name: string;
            email: string | null;
        };
        milestones: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.MilestoneStatus;
            tenantId: string;
            title: string;
            percentage: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal;
            order: number;
            dueDate: Date | null;
            quoteId: string;
            invoiceId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        tenantId: string;
        customerRecordId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        billingType: import("@prisma/client").$Enums.BillingType;
        termsAndConditions: string | null;
        signedTermsAt: Date | null;
        signerName: string | null;
        signerIp: string | null;
        signatureData: string | null;
    })[]>;
    send(user: any, quoteId: string): Promise<{
        customerRecord: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            tenantId: string;
            address: string | null;
            city: string | null;
        };
        milestones: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.MilestoneStatus;
            tenantId: string;
            title: string;
            percentage: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal;
            order: number;
            dueDate: Date | null;
            quoteId: string;
            invoiceId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        tenantId: string;
        customerRecordId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        billingType: import("@prisma/client").$Enums.BillingType;
        termsAndConditions: string | null;
        signedTermsAt: Date | null;
        signerName: string | null;
        signerIp: string | null;
        signatureData: string | null;
    }>;
}
