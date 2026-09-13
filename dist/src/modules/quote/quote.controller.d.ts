import { QuoteService } from './quote.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
export declare class QuoteController {
    private readonly quoteService;
    constructor(quoteService: QuoteService);
    create(user: any, createQuoteDto: CreateQuoteDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        tenantId: string;
        customerRecordId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(user: any): Promise<({
        customerRecord: {
            name: string;
            email: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        tenantId: string;
        customerRecordId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    send(user: any, quoteId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        tenantId: string;
        customerRecordId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
}
