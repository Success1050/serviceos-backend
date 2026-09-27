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
var SupportTicketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportTicketService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
const payment_service_1 = require("../payment/payment.service");
const resolve_dispute_dto_1 = require("./dto/resolve-dispute.dto");
let SupportTicketService = SupportTicketService_1 = class SupportTicketService {
    prisma;
    notificationService;
    paymentService;
    logger = new common_1.Logger(SupportTicketService_1.name);
    constructor(prisma, notificationService, paymentService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.paymentService = paymentService;
    }
    async generateTicketNumber(tenantId) {
        const currentYear = new Date().getFullYear();
        const prefix = `TKT-${currentYear}-`;
        const count = await this.prisma.supportTicket.count({
            where: {
                tenantId,
                ticketNumber: {
                    startsWith: prefix,
                },
            },
        });
        const sequence = (count + 1).toString().padStart(5, '0');
        return `${prefix}${sequence}`;
    }
    async createCustomerTicket(tenantId, customerRecordId, createDto, customerName) {
        const customer = await this.prisma.customerRecord.findUnique({
            where: { id: customerRecordId },
        });
        if (!customer || customer.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Customer profile not found for this tenant');
        }
        let warrantyValidAtFiling = false;
        if (createDto.type === 'WARRANTY_CLAIM') {
            if (!createDto.assetId) {
                throw new common_1.BadRequestException('An asset must be selected for warranty claims');
            }
            const asset = await this.prisma.asset.findUnique({
                where: { id: createDto.assetId },
            });
            if (!asset || asset.tenantId !== tenantId || asset.customerRecordId !== customerRecordId) {
                throw new common_1.BadRequestException('Specified asset does not belong to this customer');
            }
            if (asset.warrantyExpiresAt && new Date(asset.warrantyExpiresAt) >= new Date()) {
                warrantyValidAtFiling = true;
            }
        }
        if (createDto.type === 'BILLING_DISPUTE') {
            if (createDto.invoiceId) {
                const invoice = await this.prisma.invoice.findUnique({
                    where: { id: createDto.invoiceId },
                });
                if (!invoice || invoice.tenantId !== tenantId || invoice.customerRecordId !== customerRecordId) {
                    throw new common_1.BadRequestException('Specified invoice does not belong to this customer');
                }
                await this.prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { status: 'DISPUTED' },
                });
                this.logger.log(`Invoice ${invoice.id} marked as DISPUTED due to customer support ticket.`);
            }
        }
        if (createDto.jobId) {
            const job = await this.prisma.job.findUnique({ where: { id: createDto.jobId } });
            if (!job || job.tenantId !== tenantId || job.customerRecordId !== customerRecordId) {
                throw new common_1.BadRequestException('Specified job does not belong to this customer');
            }
        }
        const ticketNumber = await this.generateTicketNumber(tenantId);
        const priority = createDto.priority || (createDto.type === 'BILLING_DISPUTE' || warrantyValidAtFiling ? 'HIGH' : 'NORMAL');
        const ticket = await this.prisma.supportTicket.create({
            data: {
                ticketNumber,
                tenantId,
                customerRecordId,
                type: createDto.type,
                status: 'OPEN',
                priority: priority,
                subject: createDto.subject,
                description: createDto.description,
                attachments: createDto.attachments || [],
                assetId: createDto.assetId || null,
                invoiceId: createDto.invoiceId || null,
                paymentTransactionId: createDto.paymentTransactionId || null,
                jobId: createDto.jobId || null,
                warrantyValidAtFiling,
                disputedAmount: createDto.disputedAmount ? createDto.disputedAmount : null,
                disputeReason: createDto.disputeReason || null,
                messages: {
                    create: {
                        senderType: 'CUSTOMER',
                        senderName: customerName || customer.name,
                        message: createDto.description,
                        attachments: createDto.attachments || [],
                        isInternalNote: false,
                    },
                },
            },
            include: {
                customerRecord: { select: { id: true, name: true, email: true, phone: true } },
                asset: { select: { id: true, name: true, serialNumber: true, warrantyExpiresAt: true } },
                invoice: { select: { id: true, title: true, amount: true, status: true } },
                messages: true,
            },
        });
        const isUrgent = priority === 'HIGH' || priority === 'URGENT';
        const alertTitle = isUrgent
            ? `🚨 Urgent ${ticket.type.replace('_', ' ')} #${ticket.ticketNumber}`
            : `New Support Ticket #${ticket.ticketNumber}`;
        const alertMessage = `${customer.name} submitted: "${ticket.subject}"`;
        await this.notificationService.sendToTenant(tenantId, alertTitle, alertMessage, isUrgent ? 'WARNING' : 'INFO', `/dashboard/support-tickets/${ticket.id}`);
        return ticket;
    }
    async createStaffTicket(tenantId, staffUserId, staffName, createDto) {
        const customer = await this.prisma.customerRecord.findUnique({
            where: { id: createDto.customerRecordId },
        });
        if (!customer || customer.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Customer profile not found for this tenant');
        }
        let warrantyValidAtFiling = false;
        if (createDto.type === 'WARRANTY_CLAIM' && createDto.assetId) {
            const asset = await this.prisma.asset.findUnique({ where: { id: createDto.assetId } });
            if (asset?.warrantyExpiresAt && new Date(asset.warrantyExpiresAt) >= new Date()) {
                warrantyValidAtFiling = true;
            }
        }
        if (createDto.type === 'BILLING_DISPUTE' && createDto.invoiceId) {
            await this.prisma.invoice.update({
                where: { id: createDto.invoiceId },
                data: { status: 'DISPUTED' },
            });
        }
        const ticketNumber = await this.generateTicketNumber(tenantId);
        const priority = createDto.priority || 'NORMAL';
        const ticket = await this.prisma.supportTicket.create({
            data: {
                ticketNumber,
                tenantId,
                customerRecordId: createDto.customerRecordId,
                type: createDto.type,
                status: 'OPEN',
                priority: priority,
                subject: createDto.subject,
                description: createDto.description,
                attachments: createDto.attachments || [],
                assetId: createDto.assetId || null,
                invoiceId: createDto.invoiceId || null,
                paymentTransactionId: createDto.paymentTransactionId || null,
                jobId: createDto.jobId || null,
                assignedStaffId: createDto.assignedStaffId || staffUserId,
                warrantyValidAtFiling,
                disputedAmount: createDto.disputedAmount ? createDto.disputedAmount : null,
                disputeReason: createDto.disputeReason || null,
                messages: {
                    create: {
                        senderType: 'STAFF',
                        senderUserId: staffUserId,
                        senderName: staffName,
                        message: createDto.description,
                        attachments: createDto.attachments || [],
                        isInternalNote: false,
                    },
                },
            },
            include: {
                customerRecord: true,
                asset: true,
                invoice: true,
                assignedStaff: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        return ticket;
    }
    async getTickets(tenantId, filterDto) {
        const page = filterDto.page || 1;
        const limit = filterDto.limit || 20;
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (filterDto.status)
            where.status = filterDto.status;
        if (filterDto.type)
            where.type = filterDto.type;
        if (filterDto.priority)
            where.priority = filterDto.priority;
        if (filterDto.customerRecordId)
            where.customerRecordId = filterDto.customerRecordId;
        if (filterDto.assignedStaffId)
            where.assignedStaffId = filterDto.assignedStaffId;
        if (filterDto.search) {
            where.OR = [
                { ticketNumber: { contains: filterDto.search, mode: 'insensitive' } },
                { subject: { contains: filterDto.search, mode: 'insensitive' } },
                { description: { contains: filterDto.search, mode: 'insensitive' } },
                { customerRecord: { name: { contains: filterDto.search, mode: 'insensitive' } } },
            ];
        }
        const [tickets, totalCount] = await Promise.all([
            this.prisma.supportTicket.findMany({
                where,
                include: {
                    customerRecord: { select: { id: true, name: true, email: true, phone: true } },
                    asset: { select: { id: true, name: true, serialNumber: true } },
                    invoice: { select: { id: true, title: true, amount: true, status: true } },
                    assignedStaff: { select: { id: true, firstName: true, lastName: true } },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { id: true, message: true, senderName: true, senderType: true, createdAt: true },
                    },
                },
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
                skip,
                take: limit,
            }),
            this.prisma.supportTicket.count({ where }),
        ]);
        return {
            data: tickets,
            meta: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
            },
        };
    }
    async getTicketDetails(tenantId, ticketId, isCustomerView = false, customerRecordId) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                tenant: { select: { id: true, name: true, slug: true } },
                customerRecord: true,
                asset: true,
                invoice: {
                    include: {
                        escrowHold: true,
                        paymentTransactions: { orderBy: { createdAt: 'desc' }, take: 3 },
                    },
                },
                paymentTransaction: true,
                job: { select: { id: true, title: true, status: true, scheduledAt: true } },
                assignedStaff: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                resolvedBy: { select: { id: true, firstName: true, lastName: true } },
                messages: {
                    where: isCustomerView ? { isInternalNote: false } : undefined,
                    orderBy: { createdAt: 'asc' },
                    include: {
                        senderUser: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                    },
                },
            },
        });
        if (!ticket || ticket.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Support ticket not found');
        }
        if (isCustomerView && customerRecordId && ticket.customerRecordId !== customerRecordId) {
            throw new common_1.ForbiddenException('Access denied to this support ticket');
        }
        return ticket;
    }
    async addMessage(tenantId, ticketId, senderInfo, createDto) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: { customerRecord: true },
        });
        if (!ticket || ticket.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Support ticket not found');
        }
        if (senderInfo.senderType === 'CUSTOMER') {
            if (ticket.customerRecordId !== senderInfo.senderCustomerRecordId) {
                throw new common_1.ForbiddenException('Unauthorized ticket access');
            }
            createDto.isInternalNote = false;
        }
        const message = await this.prisma.supportTicketMessage.create({
            data: {
                ticketId,
                senderType: senderInfo.senderType,
                senderUserId: senderInfo.senderUserId || null,
                senderName: senderInfo.senderName,
                message: createDto.message,
                attachments: createDto.attachments || [],
                isInternalNote: !!createDto.isInternalNote,
            },
            include: {
                senderUser: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
        });
        const updateData = {};
        if (senderInfo.senderType === 'STAFF' && !createDto.isInternalNote) {
            if (!ticket.firstResponseAt) {
                updateData.firstResponseAt = new Date();
            }
            if (ticket.status === 'OPEN') {
                updateData.status = 'IN_PROGRESS';
            }
        }
        else if (senderInfo.senderType === 'CUSTOMER') {
            if (ticket.status === 'WAITING_ON_CUSTOMER') {
                updateData.status = 'IN_PROGRESS';
            }
        }
        if (Object.keys(updateData).length > 0) {
            await this.prisma.supportTicket.update({
                where: { id: ticketId },
                data: updateData,
            });
        }
        if (senderInfo.senderType === 'CUSTOMER') {
            await this.notificationService.sendToTenant(tenantId, `New reply on Ticket #${ticket.ticketNumber}`, `${senderInfo.senderName}: "${createDto.message.substring(0, 80)}"`, 'INFO', `/dashboard/support-tickets/${ticket.id}`);
        }
        else if (senderInfo.senderType === 'STAFF' && !createDto.isInternalNote) {
            const relationship = await this.prisma.customerTenantRelationship.findFirst({
                where: { tenantId, customerRecordId: ticket.customerRecordId, identityId: { not: null } },
            });
            if (relationship?.identityId) {
                await this.notificationService.sendToUser(tenantId, relationship.identityId, `Front Desk replied to Ticket #${ticket.ticketNumber}`, `Support Team: "${createDto.message.substring(0, 80)}"`, 'INFO', `/portal/support/tickets/${ticket.id}`);
            }
        }
        return message;
    }
    async updateTicketStatus(tenantId, ticketId, updateDto, staffUserId) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
        });
        if (!ticket || ticket.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Support ticket not found');
        }
        const updateData = {};
        if (updateDto.status) {
            updateData.status = updateDto.status;
            if (updateDto.status === 'RESOLVED') {
                updateData.resolvedAt = new Date();
                if (staffUserId)
                    updateData.resolvedById = staffUserId;
            }
            else if (updateDto.status === 'CLOSED') {
                updateData.closedAt = new Date();
            }
        }
        if (updateDto.priority)
            updateData.priority = updateDto.priority;
        if (updateDto.assignedStaffId !== undefined)
            updateData.assignedStaffId = updateDto.assignedStaffId;
        if (updateDto.resolutionNotes)
            updateData.resolutionNotes = updateDto.resolutionNotes;
        const updated = await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: updateData,
            include: {
                assignedStaff: { select: { id: true, firstName: true, lastName: true } },
                customerRecord: true,
            },
        });
        return updated;
    }
    async resolveWarrantyClaim(tenantId, ticketId, resolveDto, staffUserId, staffName) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: { customerRecord: true, asset: true },
        });
        if (!ticket || ticket.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Support ticket not found');
        }
        if (ticket.type !== 'WARRANTY_CLAIM') {
            throw new common_1.BadRequestException('Only tickets with type WARRANTY_CLAIM can be resolved via this action');
        }
        let reworkJobId = null;
        if (resolveDto.approved) {
            if (resolveDto.autoSpawnReworkJob) {
                const scheduledAt = resolveDto.reworkScheduledAt
                    ? new Date(resolveDto.reworkScheduledAt)
                    : new Date(Date.now() + 24 * 60 * 60 * 1000);
                const jobTitle = resolveDto.reworkJobTitle ||
                    `Warranty Repair: ${ticket.asset?.name || 'Equipment'} (${ticket.subject})`;
                const reworkJob = await this.prisma.job.create({
                    data: {
                        tenantId,
                        customerRecordId: ticket.customerRecordId,
                        title: jobTitle,
                        description: `Warranty claim #${ticket.ticketNumber} resolution. Reported defect: ${ticket.description}\nResolution Notes: ${resolveDto.resolutionNotes}`,
                        status: 'SCHEDULED',
                        scheduledAt,
                        assignedTechnicianId: resolveDto.assignedTechnicianId || null,
                    },
                });
                reworkJobId = reworkJob.id;
                this.logger.log(`Created Warranty Rework Job ${reworkJob.id} for ticket ${ticket.ticketNumber}`);
            }
            await this.prisma.supportTicket.update({
                where: { id: ticketId },
                data: {
                    status: 'RESOLVED',
                    resolvedAt: new Date(),
                    resolvedById: staffUserId,
                    resolutionNotes: resolveDto.resolutionNotes,
                    warrantyResolutionJobId: reworkJobId,
                },
            });
            await this.prisma.supportTicketMessage.create({
                data: {
                    ticketId,
                    senderType: 'SYSTEM',
                    senderName: 'ServiceOS Warranty Engine',
                    message: `✅ WARRANTY CLAIM APPROVED: ${resolveDto.resolutionNotes}${reworkJobId ? ` A warranty rework visit (#${reworkJobId.substring(0, 8)}) has been auto-scheduled.` : ''}`,
                },
            });
            await this.notificationService.sendToTenant(tenantId, `Warranty Claim Approved #${ticket.ticketNumber}`, `Claim for ${ticket.customerRecord.name} was approved by ${staffName}.`, 'SUCCESS', `/dashboard/support-tickets/${ticket.id}`);
        }
        else {
            await this.prisma.supportTicket.update({
                where: { id: ticketId },
                data: {
                    status: 'REJECTED',
                    resolvedAt: new Date(),
                    resolvedById: staffUserId,
                    resolutionNotes: resolveDto.resolutionNotes,
                },
            });
            await this.prisma.supportTicketMessage.create({
                data: {
                    ticketId,
                    senderType: 'SYSTEM',
                    senderName: 'ServiceOS Warranty Engine',
                    message: `❌ WARRANTY CLAIM DENIED: ${resolveDto.resolutionNotes}`,
                },
            });
        }
        return this.getTicketDetails(tenantId, ticketId);
    }
    async resolveChargeDispute(tenantId, ticketId, resolveDto, staffUserId, staffName) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                customerRecord: true,
                invoice: {
                    include: { escrowHold: true, paymentTransactions: true },
                },
            },
        });
        if (!ticket || ticket.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Support ticket not found');
        }
        if (ticket.type !== 'BILLING_DISPUTE') {
            throw new common_1.BadRequestException('Only tickets with type BILLING_DISPUTE can be resolved via this action');
        }
        let refundTransactionId = null;
        const now = new Date();
        switch (resolveDto.action) {
            case resolve_dispute_dto_1.DisputeResolutionActionEnum.UPHOLD_CHARGE: {
                if (ticket.invoice) {
                    const hasSuccessfulPayment = ticket.invoice.paymentTransactions.some(tx => tx.status === 'SUCCESSFUL');
                    const restoredStatus = hasSuccessfulPayment ? 'PAID' : 'SENT';
                    await this.prisma.invoice.update({
                        where: { id: ticket.invoice.id },
                        data: { status: restoredStatus },
                    });
                }
                await this.prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: {
                        status: 'RESOLVED',
                        resolutionAction: 'UPHOLD_CHARGE',
                        resolvedAt: now,
                        resolvedById: staffUserId,
                        resolutionNotes: resolveDto.resolutionNotes,
                    },
                });
                await this.prisma.supportTicketMessage.create({
                    data: {
                        ticketId,
                        senderType: 'SYSTEM',
                        senderName: 'ServiceOS Billing Desk',
                        message: `DISPUTE REVIEWED - CHARGE UPHELD: ${resolveDto.resolutionNotes}`,
                    },
                });
                break;
            }
            case resolve_dispute_dto_1.DisputeResolutionActionEnum.PARTIAL_CREDIT: {
                if (!resolveDto.adjustedAmount || resolveDto.adjustedAmount <= 0) {
                    throw new common_1.BadRequestException('adjustedAmount must be greater than 0 for partial credit');
                }
                if (ticket.invoice) {
                    const originalAmount = Number(ticket.invoice.amount);
                    const newAmount = Math.max(0, originalAmount - resolveDto.adjustedAmount);
                    await this.prisma.invoice.update({
                        where: { id: ticket.invoice.id },
                        data: {
                            amount: newAmount,
                            status: newAmount === 0 ? 'PAID' : 'SENT',
                        },
                    });
                }
                await this.prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: {
                        status: 'RESOLVED',
                        resolutionAction: 'PARTIAL_CREDIT',
                        resolvedAt: now,
                        resolvedById: staffUserId,
                        resolutionNotes: resolveDto.resolutionNotes,
                        disputedAmount: resolveDto.adjustedAmount,
                    },
                });
                await this.prisma.supportTicketMessage.create({
                    data: {
                        ticketId,
                        senderType: 'SYSTEM',
                        senderName: 'ServiceOS Billing Desk',
                        message: `DISPUTE RESOLVED - PARTIAL CREDIT OF ${resolveDto.adjustedAmount} APPLIED: ${resolveDto.resolutionNotes}`,
                    },
                });
                break;
            }
            case resolve_dispute_dto_1.DisputeResolutionActionEnum.FULL_REFUND:
            case resolve_dispute_dto_1.DisputeResolutionActionEnum.VOID_INVOICE: {
                if (ticket.invoice?.escrowHold && ticket.invoice.escrowHold.status === 'HELD') {
                    await this.paymentService.releaseEscrowHold(ticket.invoice.escrowHold.id, tenantId, `Dispute resolved: ${resolveDto.resolutionNotes}`);
                }
                if (ticket.invoice) {
                    await this.prisma.invoice.update({
                        where: { id: ticket.invoice.id },
                        data: { status: 'CANCELLED' },
                    });
                }
                const refundTx = await this.prisma.paymentTransaction.create({
                    data: {
                        tenantId,
                        customerRecordId: ticket.customerRecordId,
                        invoiceId: ticket.invoiceId || null,
                        gateway: 'STRIPE',
                        transactionReference: `ref_disp_${Date.now()}_${ticket.ticketNumber}`,
                        amount: ticket.disputedAmount || (ticket.invoice ? ticket.invoice.amount : 0),
                        currency: 'USD',
                        type: 'REFUND',
                        status: 'SUCCESSFUL',
                        metadata: {
                            ticketNumber: ticket.ticketNumber,
                            reason: resolveDto.resolutionNotes,
                            action: resolveDto.action,
                        },
                    },
                });
                refundTransactionId = refundTx.id;
                await this.prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: {
                        status: 'RESOLVED',
                        resolutionAction: resolveDto.action,
                        resolvedAt: now,
                        resolvedById: staffUserId,
                        resolutionNotes: resolveDto.resolutionNotes,
                        refundTransactionId,
                    },
                });
                await this.prisma.supportTicketMessage.create({
                    data: {
                        ticketId,
                        senderType: 'SYSTEM',
                        senderName: 'ServiceOS Billing Desk',
                        message: `DISPUTE RESOLVED - ${resolveDto.action === 'FULL_REFUND' ? 'FULL REFUND ISSUED' : 'INVOICE VOIDED'}: ${resolveDto.resolutionNotes}`,
                    },
                });
                break;
            }
        }
        await this.notificationService.sendToTenant(tenantId, `Dispute Resolved #${ticket.ticketNumber}`, `Billing dispute for ${ticket.customerRecord.name} resolved (${resolveDto.action}) by ${staffName}.`, 'SUCCESS', `/dashboard/support-tickets/${ticket.id}`);
        return this.getTicketDetails(tenantId, ticketId);
    }
    async getSupportMetrics(tenantId) {
        const [openCount, inProgressCount, waitingCustomerCount, disputesCount, warrantyCount, urgentCount, resolvedTickets] = await Promise.all([
            this.prisma.supportTicket.count({ where: { tenantId, status: 'OPEN' } }),
            this.prisma.supportTicket.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
            this.prisma.supportTicket.count({ where: { tenantId, status: 'WAITING_ON_CUSTOMER' } }),
            this.prisma.supportTicket.count({
                where: { tenantId, type: 'BILLING_DISPUTE', status: { in: ['OPEN', 'IN_PROGRESS', 'ACTION_REQUIRED'] } },
            }),
            this.prisma.supportTicket.count({
                where: { tenantId, type: 'WARRANTY_CLAIM', status: { in: ['OPEN', 'IN_PROGRESS', 'ACTION_REQUIRED'] } },
            }),
            this.prisma.supportTicket.count({
                where: { tenantId, priority: 'URGENT', status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] } },
            }),
            this.prisma.supportTicket.findMany({
                where: { tenantId, status: 'RESOLVED', resolvedAt: { not: null } },
                select: { createdAt: true, resolvedAt: true },
                take: 50,
                orderBy: { resolvedAt: 'desc' },
            }),
        ]);
        let avgResolutionHours = 0;
        if (resolvedTickets.length > 0) {
            const totalMillis = resolvedTickets.reduce((sum, t) => {
                const diff = t.resolvedAt.getTime() - t.createdAt.getTime();
                return sum + diff;
            }, 0);
            avgResolutionHours = Math.round((totalMillis / (resolvedTickets.length * 1000 * 60 * 60)) * 10) / 10;
        }
        return {
            openTickets: openCount,
            inProgressTickets: inProgressCount,
            waitingOnCustomer: waitingCustomerCount,
            activeBillingDisputes: disputesCount,
            activeWarrantyClaims: warrantyCount,
            urgentAttentionRequired: urgentCount,
            avgResolutionHours,
        };
    }
    async getCustomerTickets(tenantId, customerRecordId) {
        return this.prisma.supportTicket.findMany({
            where: { tenantId, customerRecordId },
            include: {
                asset: { select: { id: true, name: true, serialNumber: true } },
                invoice: { select: { id: true, title: true, amount: true, status: true } },
                messages: {
                    where: { isInternalNote: false },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { id: true, message: true, senderName: true, createdAt: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.SupportTicketService = SupportTicketService;
exports.SupportTicketService = SupportTicketService = SupportTicketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService,
        payment_service_1.PaymentService])
], SupportTicketService);
//# sourceMappingURL=support-ticket.service.js.map