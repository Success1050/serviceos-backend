import { PaymentService } from './payment.service';
import { AuthorizeHoldDto } from './dto/authorize-hold.dto';
import { ReleaseHoldDto } from './dto/capture-hold.dto';
import { InitializeCheckoutDto, CreateMilestoneInvoiceDto } from './dto/initialize-checkout.dto';
import { LogBankTransferDto } from './dto/log-bank-transfer.dto';
import { GatewayType } from './adapters/payment-gateway.interface';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    authorizeHold(user: any, dto: AuthorizeHoldDto): Promise<{
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
    captureHold(user: any, holdId: string): Promise<{
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
    releaseHold(user: any, holdId: string, dto: ReleaseHoldDto): Promise<{
        success: boolean;
        status: string;
    }>;
    getEscrowHolds(user: any): Promise<({
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
    convertMilestoneToInvoice(user: any, milestoneId: string, dto: Partial<CreateMilestoneInvoiceDto>): Promise<{
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
    initializeCheckout(user: any, dto: InitializeCheckoutDto): Promise<{
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
    logBankTransfer(user: any, dto: LogBankTransferDto): Promise<{
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
    handleWebhook(gateway: string, payload: any, paystackSignature?: string, stripeSignature?: string): Promise<{
        received: boolean;
    }>;
}
