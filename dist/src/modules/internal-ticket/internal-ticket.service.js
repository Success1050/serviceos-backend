"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalTicketService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const mail_service_1 = require("../../core/mail/mail.service");
const notification_service_1 = require("../notification/notification.service");
let InternalTicketService = class InternalTicketService {
    prisma;
    mailService;
    notificationService;
    constructor(prisma, mailService, notificationService) {
        this.prisma = prisma;
        this.mailService = mailService;
        this.notificationService = notificationService;
    }
    async createTicket(tenantId, authorId, dto) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant?.parentId) {
            throw new common_1.ForbiddenException('Only sub-companies can create internal tickets directed to HQ.');
        }
        const ticket = await this.prisma.internalTicket.create({
            data: {
                tenantId,
                authorId,
                title: dto.title,
                description: dto.description,
            },
        });
        const hqUsers = await this.prisma.user.findMany({
            where: { tenantId: tenant.parentId, role: { in: ['TENANT_OWNER', 'TENANT_ADMIN'] } },
        });
        for (const hqUser of hqUsers) {
            await this.notificationService.sendToUser(tenant.parentId, hqUser.id, `New ticket from branch: ${tenant.name}`, `Ticket "${ticket.title}" needs attention.`, 'INFO', `/internal-tickets/${ticket.id}`);
            await this.mailService.sendInternalTicketAlert(hqUser.email, tenant.name, ticket.title);
        }
        return ticket;
    }
    async getTickets(user) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id: user.tenantId } });
        if (!tenant?.parentId) {
            return this.prisma.internalTicket.findMany({
                where: { tenant: { parentId: tenant?.id || user.tenantId } },
                include: { tenant: { select: { name: true } }, author: { select: { firstName: true, lastName: true } } },
                orderBy: { createdAt: 'desc' },
            });
        }
        else {
            return this.prisma.internalTicket.findMany({
                where: { tenantId: user.tenantId },
                include: { author: { select: { firstName: true, lastName: true } } },
                orderBy: { createdAt: 'desc' },
            });
        }
    }
    async updateTicketStatus(user, ticketId, status) {
        const ticket = await this.prisma.internalTicket.findUnique({
            where: { id: ticketId },
            include: { tenant: true }
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        if (ticket.tenant.parentId !== user.tenantId) {
            throw new common_1.ForbiddenException('You can only update tickets submitted by your sub-companies');
        }
        return this.prisma.internalTicket.update({
            where: { id: ticketId },
            data: { status },
        });
    }
};
exports.InternalTicketService = InternalTicketService;
exports.InternalTicketService = InternalTicketService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService,
        notification_service_1.NotificationService])
], InternalTicketService);
//# sourceMappingURL=internal-ticket.service.js.map