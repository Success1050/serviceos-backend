import { PrismaService } from '../../core/prisma/prisma.service';
import { MailService } from '../../core/mail/mail.service';
import { NotificationService } from '../notification/notification.service';
export declare class InternalTicketService {
    private readonly prisma;
    private readonly mailService;
    private readonly notificationService;
    constructor(prisma: PrismaService, mailService: MailService, notificationService: NotificationService);
    createTicket(tenantId: string, authorId: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InternalTicketStatus;
        tenantId: string;
        title: string;
        description: string;
        authorId: string;
    }>;
    getTickets(user: any): Promise<({
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
        title: string;
        description: string;
        authorId: string;
    })[]>;
    updateTicketStatus(user: any, ticketId: string, status: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InternalTicketStatus;
        tenantId: string;
        title: string;
        description: string;
        authorId: string;
    }>;
}
