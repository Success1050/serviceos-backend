import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { PaymentGatewayFactory } from './adapters/payment-gateway.factory';
import { GatewayType } from './adapters/payment-gateway.interface';
export declare class PaymentService {
    private readonly prisma;
    private readonly gatewayFactory;
    private readonly notificationService;
    private readonly logger;
    constructor(prisma: PrismaService, gatewayFactory: PaymentGatewayFactory, notificationService: NotificationService);
    authorizePreArrivalHoldForJob(jobId: string, tenantId?: string, paymentToken?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.EscrowHoldStatus;
        tenantId: string;
        customerRecordId: string;
        expiresAt: Date | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        invoiceId: string | null;
        jobId: string | null;
        failureReason: string | null;
        currency: string;
        capturedAt: Date | null;
        releasedAt: Date | null;
        gateway: import("@prisma/client").$Enums.PaymentGatewayType;
        gatewayAuthId: string | null;
    } | {
        success: boolean;
        status: string;
        failureReason: string;
    }>;
    captureEscrowHoldForJob(jobId: string, tenantId?: string): Promise<{
        captured: boolean;
        holdId: string;
        amount: number;
        reason?: undefined;
    } | {
        captured: boolean;
        reason: string | undefined;
        holdId?: undefined;
        amount?: undefined;
    }>;
    releaseEscrowHold(holdId: string, tenantId: string, reason?: string): Promise<{
        success: boolean;
        status: string;
    }>;
    convertMilestoneToInvoice(tenantId: string, milestoneId: string, dueInDays?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        tenantId: string;
        customerRecordId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        dueDate: Date | null;
        jobId: string | null;
        paidAt: Date | null;
    }>;
    initializeCheckout(tenantId: string, invoiceId: string, callbackUrl?: string): Promise<{
        invoiceId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: any;
        gateway: GatewayType;
        paymentUrl: string | undefined;
        virtualAccount: {
            bankName: string;
            accountNumber: string;
            accountName: string;
        } | undefined;
    }>;
    getEscrowHolds(tenantId: string): Promise<({
        customerRecord: {
            name: string;
            email: string | null;
        };
        job: {
            status: import("@prisma/client").$Enums.JobStatus;
            title: string;
            scheduledAt: Date | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.EscrowHoldStatus;
        tenantId: string;
        customerRecordId: string;
        expiresAt: Date | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        invoiceId: string | null;
        jobId: string | null;
        failureReason: string | null;
        currency: string;
        capturedAt: Date | null;
        releasedAt: Date | null;
        gateway: import("@prisma/client").$Enums.PaymentGatewayType;
        gatewayAuthId: string | null;
    })[]>;
    handleWebhook(gateway: GatewayType, payload: any, signature?: string): Promise<{
        received: boolean;
    }>;
    logManualBankTransfer(tenantId: string, verifiedByUserId: string, dto: {
        invoiceId: string;
        amount: number;
        bankName: string;
        transactionReference: string;
        proofOfPaymentUrl?: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        transactionId: string;
        invoice: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            tenantId: string;
            customerRecordId: string;
            title: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            dueDate: Date | null;
            jobId: string | null;
            paidAt: Date | null;
        };
        milestoneSettled: boolean;
    }>;
}
