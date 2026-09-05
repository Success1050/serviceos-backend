import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
export declare class QuoteService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createQuote(tenantId: string, createQuoteDto: CreateQuoteDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.QuoteStatus;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    getQuotes(tenantId: string): Promise<({
        customerRecord: {
            name: string;
            email: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.QuoteStatus;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    sendQuote(tenantId: string, quoteId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.QuoteStatus;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
}
