import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { MailService } from '../../core/mail/mail.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class InternalTicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService
  ) {}

  async createTicket(tenantId: string, authorId: string, dto: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant?.parentId) {
      throw new ForbiddenException('Only sub-companies can create internal tickets directed to HQ.');
    }

    const ticket = await this.prisma.internalTicket.create({
      data: {
        tenantId,
        authorId,
        title: dto.title,
        description: dto.description,
      },
    });

    // Notify HQ
    const hqUsers = await this.prisma.user.findMany({
      where: { tenantId: tenant.parentId },
    });

    for (const hqUser of hqUsers) {
      // 1. System Notification
      await this.notificationService.sendToUser(
        tenant.parentId,
        hqUser.id,
        `New ticket from branch: ${tenant.name}`,
        `Ticket "${ticket.title}" needs attention.`,
        'INFO',
        `/internal-tickets/${ticket.id}`
      );

      // 2. Email Notification
      await this.mailService.sendInternalTicketAlert(hqUser.email, tenant.name, ticket.title);
    }

    return ticket;
  }

  async getTickets(user: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: user.tenantId } });

    if (!tenant?.parentId) {
      // HQ viewing all sub-company tickets
      return this.prisma.internalTicket.findMany({
        where: { tenant: { parentId: tenant?.id || user.tenantId } },
        include: { tenant: { select: { name: true } }, author: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Sub-company viewing their own tickets
      return this.prisma.internalTicket.findMany({
        where: { tenantId: user.tenantId },
        include: { author: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  async updateTicketStatus(user: any, ticketId: string, status: any) {
    const ticket = await this.prisma.internalTicket.findUnique({
      where: { id: ticketId },
      include: { tenant: true }
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    
    if (ticket.tenant.parentId !== user.tenantId) {
      throw new ForbiddenException('You can only update tickets submitted by your sub-companies');
    }

    return this.prisma.internalTicket.update({
      where: { id: ticketId },
      data: { status },
    });
  }
}
