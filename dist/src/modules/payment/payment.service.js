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
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
const payment_gateway_factory_1 = require("./adapters/payment-gateway.factory");
let PaymentService = PaymentService_1 = class PaymentService {
    prisma;
    gatewayFactory;
    notificationService;
    logger = new common_1.Logger(PaymentService_1.name);
    constructor(prisma, gatewayFactory, notificationService) {
        this.prisma = prisma;
        this.gatewayFactory = gatewayFactory;
        this.notificationService = notificationService;
    }
    async authorizePreArrivalHoldForJob(jobId, tenantId, paymentToken) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                customerRecord: true,
                quote: true,
                invoices: true,
                tenant: { include: { settings: true } },
            },
        });
        if (!job)
            throw new common_1.NotFoundException(`Job with ID ${jobId} not found`);
        if (tenantId && job.tenantId !== tenantId) {
            throw new common_1.ForbiddenException('Job belongs to another tenant');
        }
        const holdAmount = Number(job.quote?.amount || job.invoices[0]?.amount || 150);
        const currency = job.tenant?.settings?.businessProfile?.currency || 'USD';
        const gatewayAdapter = this.gatewayFactory.resolveAdapter(job.tenant?.settings, currency);
        this.logger.log(`Initiating pre-arrival hold of ${holdAmount} ${currency} for Job ${job.id} on gateway ${gatewayAdapter.gatewayName}`);
        const holdResult = await gatewayAdapter.authorizeHold({
            amount: holdAmount,
            currency,
            customerEmail: job.customerRecord.email || 'customer@serviceos.local',
            customerName: job.customerRecord.name,
            paymentMethodToken: paymentToken,
            metadata: { jobId: job.id, tenantId: job.tenantId },
        });
        if (holdResult.success && holdResult.status === 'HELD') {
            const escrowHold = await this.prisma.escrowHold.create({
                data: {
                    tenantId: job.tenantId,
                    jobId: job.id,
                    customerRecordId: job.customerRecordId,
                    invoiceId: job.invoices[0]?.id || null,
                    gateway: gatewayAdapter.gatewayName,
                    gatewayAuthId: holdResult.authorizationId,
                    amount: holdAmount,
                    currency,
                    status: 'HELD',
                    expiresAt: holdResult.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            await this.prisma.job.update({
                where: { id: job.id },
                data: { paymentHoldStatus: 'HELD' },
            });
            await this.prisma.paymentTransaction.create({
                data: {
                    tenantId: job.tenantId,
                    customerRecordId: job.customerRecordId,
                    invoiceId: job.invoices[0]?.id || null,
                    gateway: gatewayAdapter.gatewayName,
                    transactionReference: `hold_tx_${Date.now()}_${job.id.substring(0, 6)}`,
                    gatewayReference: holdResult.authorizationId,
                    amount: holdAmount,
                    currency,
                    type: 'HOLD',
                    status: 'SUCCESSFUL',
                    metadata: holdResult.rawResponse,
                },
            });
            await this.notificationService.sendToTenant(job.tenantId, 'Site Visit Escrow Hold Confirmed', `Pre-arrival payment hold of ${holdAmount} ${currency} authorized for Job: ${job.title}. Technician is cleared for site visit.`, 'SUCCESS', `/dashboard/jobs/${job.id}`);
            return escrowHold;
        }
        else {
            await this.prisma.job.update({
                where: { id: job.id },
                data: { paymentHoldStatus: 'HOLD_FAILED' },
            });
            await this.prisma.escrowHold.create({
                data: {
                    tenantId: job.tenantId,
                    jobId: job.id,
                    customerRecordId: job.customerRecordId,
                    gateway: gatewayAdapter.gatewayName,
                    amount: holdAmount,
                    currency,
                    status: 'FAILED',
                    failureReason: holdResult.failureReason || 'Insufficient funds or card authorization declined',
                },
            });
            await this.prisma.paymentTransaction.create({
                data: {
                    tenantId: job.tenantId,
                    customerRecordId: job.customerRecordId,
                    gateway: gatewayAdapter.gatewayName,
                    transactionReference: `failed_hold_${Date.now()}_${job.id.substring(0, 6)}`,
                    amount: holdAmount,
                    currency,
                    type: 'HOLD',
                    status: 'FAILED',
                    metadata: { failureReason: holdResult.failureReason },
                },
            });
            await this.notificationService.sendToTenant(job.tenantId, '⚠️ Pre-Arrival Payment Hold FAILED', `Hold of ${holdAmount} ${currency} failed for Job: ${job.title}. Site visit paused. Do NOT deploy technician to site until resolved!`, 'WARNING', `/dashboard/jobs/${job.id}`);
            return {
                success: false,
                status: 'HOLD_FAILED',
                failureReason: holdResult.failureReason || 'Card authorization failed',
            };
        }
    }
    async captureEscrowHoldForJob(jobId, tenantId) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                escrowHolds: { where: { status: 'HELD' }, orderBy: { createdAt: 'desc' } },
                invoices: true,
                tenant: { include: { settings: true } },
            },
        });
        if (!job)
            throw new common_1.NotFoundException(`Job ${jobId} not found`);
        if (tenantId && job.tenantId !== tenantId) {
            throw new common_1.ForbiddenException('Job belongs to another tenant');
        }
        const activeHold = job.escrowHolds[0];
        if (!activeHold) {
            this.logger.warn(`No active HELD escrow hold found for Job ${jobId}. Skipping instant capture.`);
            return { captured: false, reason: 'No active escrow hold found' };
        }
        const gatewayAdapter = this.gatewayFactory.getAdapter(activeHold.gateway);
        const invoice = job.invoices[0];
        const totalInvoiceAmount = invoice ? Number(invoice.amount) : Number(activeHold.amount);
        const holdAmount = Number(activeHold.amount);
        this.logger.log(`Capturing escrow hold ${activeHold.id} (${holdAmount}) for Job ${jobId}. Invoice total: ${totalInvoiceAmount}`);
        const captureResult = await gatewayAdapter.captureHold({
            authorizationId: activeHold.gatewayAuthId || activeHold.id,
            amount: Math.min(holdAmount, totalInvoiceAmount),
            currency: activeHold.currency,
            metadata: { jobId: job.id, invoiceId: invoice?.id },
        });
        if (captureResult.success) {
            const now = new Date();
            await this.prisma.escrowHold.update({
                where: { id: activeHold.id },
                data: {
                    status: 'CAPTURED',
                    capturedAt: now,
                },
            });
            await this.prisma.job.update({
                where: { id: job.id },
                data: { paymentHoldStatus: 'CAPTURED' },
            });
            await this.prisma.paymentTransaction.create({
                data: {
                    tenantId: job.tenantId,
                    customerRecordId: job.customerRecordId,
                    invoiceId: invoice?.id || null,
                    gateway: activeHold.gateway,
                    transactionReference: captureResult.transactionReference || `cap_${Date.now()}`,
                    amount: Math.min(holdAmount, totalInvoiceAmount),
                    currency: activeHold.currency,
                    type: 'CAPTURE',
                    status: 'SUCCESSFUL',
                },
            });
            if (invoice) {
                if (totalInvoiceAmount <= holdAmount) {
                    await this.prisma.invoice.update({
                        where: { id: invoice.id },
                        data: { status: 'PAID', paidAt: now },
                    });
                }
                else {
                    const remainingDelta = totalInvoiceAmount - holdAmount;
                    await this.prisma.invoice.update({
                        where: { id: invoice.id },
                        data: { status: 'PARTIALLY_PAID' },
                    });
                    await this.notificationService.sendToTenant(job.tenantId, 'Job Final Balance Due', `Escrow hold of ${holdAmount} captured, but total was ${totalInvoiceAmount}. Remaining ${remainingDelta} ${activeHold.currency} requires customer authorization.`, 'INFO', `/dashboard/invoices/${invoice.id}`);
                }
            }
            await this.notificationService.sendToTenant(job.tenantId, '💰 Escrow Captured: Payment Settled!', `Site job #${job.id.substring(0, 8)} completed with customer OTP. Funds of ${Math.min(holdAmount, totalInvoiceAmount)} ${activeHold.currency} successfully captured!`, 'SUCCESS', `/dashboard/jobs/${job.id}`);
            return { captured: true, holdId: activeHold.id, amount: Math.min(holdAmount, totalInvoiceAmount) };
        }
        else {
            this.logger.error(`Escrow capture failed for hold ${activeHold.id}: ${captureResult.failureReason}`);
            return { captured: false, reason: captureResult.failureReason };
        }
    }
    async releaseEscrowHold(holdId, tenantId, reason) {
        const hold = await this.prisma.escrowHold.findUnique({
            where: { id: holdId },
        });
        if (!hold || hold.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Escrow hold not found');
        }
        if (hold.status !== 'HELD') {
            throw new common_1.BadRequestException('Only active HELD escrow holds can be released');
        }
        const gatewayAdapter = this.gatewayFactory.getAdapter(hold.gateway);
        const releaseResult = await gatewayAdapter.releaseHold({
            authorizationId: hold.gatewayAuthId || hold.id,
            reason,
        });
        if (releaseResult.success) {
            const now = new Date();
            await this.prisma.escrowHold.update({
                where: { id: hold.id },
                data: {
                    status: 'RELEASED',
                    releasedAt: now,
                },
            });
            if (hold.jobId) {
                await this.prisma.job.update({
                    where: { id: hold.jobId },
                    data: { paymentHoldStatus: 'RELEASED' },
                });
            }
            await this.prisma.paymentTransaction.create({
                data: {
                    tenantId: hold.tenantId,
                    customerRecordId: hold.customerRecordId,
                    gateway: hold.gateway,
                    transactionReference: `rel_${Date.now()}_${hold.id.substring(0, 6)}`,
                    amount: hold.amount,
                    currency: hold.currency,
                    type: 'REFUND',
                    status: 'SUCCESSFUL',
                    metadata: { reason },
                },
            });
            return { success: true, status: 'RELEASED' };
        }
        else {
            throw new common_1.BadRequestException(`Failed to release hold: ${releaseResult.failureReason}`);
        }
    }
    async convertMilestoneToInvoice(tenantId, milestoneId, dueInDays = 7) {
        const milestone = await this.prisma.quoteMilestone.findUnique({
            where: { id: milestoneId },
            include: {
                quote: { include: { customerRecord: true } },
            },
        });
        if (!milestone || milestone.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Milestone not found for this tenant');
        }
        if (milestone.status === 'PAID') {
            throw new common_1.BadRequestException('Milestone is already paid');
        }
        if (milestone.invoiceId) {
            const existingInvoice = await this.prisma.invoice.findUnique({
                where: { id: milestone.invoiceId },
            });
            if (existingInvoice)
                return existingInvoice;
        }
        const dueDate = new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000);
        const invoice = await this.prisma.invoice.create({
            data: {
                tenantId,
                customerRecordId: milestone.quote.customerRecordId,
                title: `Milestone: ${milestone.title} - ${milestone.quote.title}`,
                amount: milestone.amount,
                status: 'SENT',
                dueDate,
            },
        });
        await this.prisma.quoteMilestone.update({
            where: { id: milestone.id },
            data: {
                status: 'INVOICED',
                invoiceId: invoice.id,
            },
        });
        await this.notificationService.sendToTenant(tenantId, 'Milestone Invoice Generated', `Invoice #${invoice.id.substring(0, 8)} generated for Milestone: ${milestone.title} (${milestone.amount}).`, 'INFO', `/dashboard/invoices/${invoice.id}`);
        return invoice;
    }
    async initializeCheckout(tenantId, invoiceId, callbackUrl) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                customerRecord: true,
                tenant: { include: { settings: true } },
            },
        });
        if (!invoice || invoice.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        if (invoice.status === 'PAID') {
            throw new common_1.BadRequestException('Invoice is already paid');
        }
        const currency = invoice.tenant.settings?.businessProfile?.currency || 'USD';
        const gatewayAdapter = this.gatewayFactory.resolveAdapter(invoice.tenant.settings, currency);
        const paymentResult = await gatewayAdapter.initializePayment({
            amount: Number(invoice.amount),
            currency,
            customerEmail: invoice.customerRecord.email || 'billing@serviceos.local',
            customerName: invoice.customerRecord.name,
            callbackUrl,
            metadata: { invoiceId: invoice.id, tenantId },
        });
        if (!paymentResult.success) {
            throw new common_1.BadRequestException('Failed to initialize payment with gateway');
        }
        await this.prisma.paymentTransaction.create({
            data: {
                tenantId,
                customerRecordId: invoice.customerRecordId,
                invoiceId: invoice.id,
                gateway: gatewayAdapter.gatewayName,
                transactionReference: paymentResult.transactionReference,
                amount: invoice.amount,
                currency,
                type: 'DIRECT_CHARGE',
                status: 'PENDING',
                metadata: paymentResult.rawResponse,
            },
        });
        return {
            invoiceId: invoice.id,
            amount: invoice.amount,
            currency,
            gateway: gatewayAdapter.gatewayName,
            paymentUrl: paymentResult.paymentUrl,
            virtualAccount: paymentResult.virtualAccount,
        };
    }
    async getEscrowHolds(tenantId) {
        return this.prisma.escrowHold.findMany({
            where: { tenantId },
            include: {
                customerRecord: { select: { name: true, email: true } },
                job: { select: { title: true, scheduledAt: true, status: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async handleWebhook(gateway, payload, signature) {
        const adapter = this.gatewayFactory.getAdapter(gateway);
        const eventResult = await adapter.handleWebhook(payload, signature);
        if (eventResult.status === 'SUCCESSFUL') {
            const tx = await this.prisma.paymentTransaction.findUnique({
                where: { transactionReference: eventResult.reference },
            });
            if (tx) {
                await this.prisma.paymentTransaction.update({
                    where: { id: tx.id },
                    data: { status: 'SUCCESSFUL' },
                });
                if (tx.invoiceId) {
                    await this.prisma.invoice.update({
                        where: { id: tx.invoiceId },
                        data: { status: 'PAID', paidAt: new Date() },
                    });
                    const milestone = await this.prisma.quoteMilestone.findFirst({
                        where: { invoiceId: tx.invoiceId },
                    });
                    if (milestone) {
                        await this.prisma.quoteMilestone.update({
                            where: { id: milestone.id },
                            data: { status: 'PAID' },
                        });
                    }
                }
            }
        }
        return { received: true };
    }
    async logManualBankTransfer(tenantId, verifiedByUserId, dto) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: dto.invoiceId },
            include: { customerRecord: true, quoteMilestone: true, tenant: { include: { settings: true } } },
        });
        if (!invoice || invoice.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Invoice not found for this tenant');
        }
        if (invoice.status === 'PAID') {
            throw new common_1.BadRequestException('Invoice is already marked as PAID');
        }
        const now = new Date();
        const tx = await this.prisma.paymentTransaction.create({
            data: {
                tenantId,
                customerRecordId: invoice.customerRecordId,
                invoiceId: invoice.id,
                gateway: 'PAYSTACK',
                transactionReference: dto.transactionReference,
                amount: dto.amount,
                currency: invoice.tenant.settings?.businessProfile?.currency || 'NGN',
                type: 'DIRECT_CHARGE',
                paymentMethod: 'BANK_TRANSFER',
                status: 'SUCCESSFUL',
                metadata: {
                    bankName: dto.bankName,
                    proofOfPaymentUrl: dto.proofOfPaymentUrl,
                    verifiedByUserId,
                    notes: dto.notes,
                    loggedAt: now,
                },
            },
        });
        const invoiceAmount = Number(invoice.amount);
        const isFullyPaid = dto.amount >= invoiceAmount;
        const updatedInvoice = await this.prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
                paidAt: isFullyPaid ? now : null,
            },
        });
        if (invoice.quoteMilestone && isFullyPaid) {
            await this.prisma.quoteMilestone.update({
                where: { id: invoice.quoteMilestone.id },
                data: { status: 'PAID' },
            });
        }
        await this.prisma.auditLog.create({
            data: {
                tenantId,
                userId: verifiedByUserId,
                action: 'CONFIRM_BANK_TRANSFER',
                entityType: 'Invoice',
                entityId: invoice.id,
                details: {
                    amount: dto.amount,
                    bankName: dto.bankName,
                    ref: dto.transactionReference,
                    isFullyPaid,
                },
            },
        });
        await this.notificationService.sendToTenant(tenantId, 'Bank Transfer Verified', `Bank transfer of ${dto.amount} from ${invoice.customerRecord.name} via ${dto.bankName} confirmed. Invoice #${invoice.id.substring(0, 8)} marked ${isFullyPaid ? 'PAID' : 'PARTIALLY_PAID'}.`, 'SUCCESS', `/dashboard/invoices/${invoice.id}`);
        return {
            success: true,
            transactionId: tx.id,
            invoice: updatedInvoice,
            milestoneSettled: !!invoice.quoteMilestone && isFullyPaid,
        };
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payment_gateway_factory_1.PaymentGatewayFactory,
        notification_service_1.NotificationService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map