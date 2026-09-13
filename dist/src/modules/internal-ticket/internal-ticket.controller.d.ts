import { InternalTicketService } from './internal-ticket.service';
export declare class InternalTicketController {
    private readonly internalTicketService;
    constructor(internalTicketService: InternalTicketService);
    create(dto: any, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InternalTicketStatus;
        tenantId: string;
        description: string;
        title: string;
        authorId: string;
    }>;
    findAll(user: any): Promise<({
        author: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InternalTicketStatus;
        tenantId: string;
        description: string;
        title: string;
        authorId: string;
    })[]>;
    updateStatus(id: string, status: any, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InternalTicketStatus;
        tenantId: string;
        description: string;
        title: string;
        authorId: string;
    }>;
}
