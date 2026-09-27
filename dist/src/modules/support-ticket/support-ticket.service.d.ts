import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { PaymentService } from '../payment/payment.service';
import { CreateCustomerTicketDto } from './dto/create-customer-ticket.dto';
import { CreateStaffTicketDto } from './dto/create-staff-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { FilterTicketsDto } from './dto/filter-tickets.dto';
import { ResolveWarrantyDto } from './dto/resolve-warranty.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
export declare class SupportTicketService {
    private readonly prisma;
    private readonly notificationService;
    private readonly paymentService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationService: NotificationService, paymentService: PaymentService);
    private generateTicketNumber;
    createCustomerTicket(tenantId: string, customerRecordId: string, createDto: CreateCustomerTicketDto, customerName: string): Promise<{
        customerRecord: {
            name: string;
            id: string;
            email: string | null;
            phone: string | null;
        };
        asset: {
            name: string;
            id: string;
            serialNumber: string | null;
            warrantyExpiresAt: Date | null;
        } | null;
        invoice: {
            id: string;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            title: string;
            amount: import("@prisma/client/runtime/library").Decimal;
        } | null;
        messages: {
            message: string;
            id: string;
            createdAt: Date;
            attachments: string[];
            isInternalNote: boolean;
            senderType: import("@prisma/client").$Enums.MessageSenderType;
            senderName: string;
            readAt: Date | null;
            senderUserId: string | null;
            ticketId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SupportTicketStatus;
        tenantId: string;
        customerRecordId: string;
        description: string;
        invoiceId: string | null;
        assetId: string | null;
        attachments: string[];
        jobId: string | null;
        type: import("@prisma/client").$Enums.SupportTicketType;
        subject: string;
        priority: import("@prisma/client").$Enums.TicketPriority;
        paymentTransactionId: string | null;
        disputedAmount: import("@prisma/client/runtime/library").Decimal | null;
        disputeReason: import("@prisma/client").$Enums.DisputeReason | null;
        assignedStaffId: string | null;
        resolutionNotes: string | null;
        ticketNumber: string;
        warrantyValidAtFiling: boolean | null;
        warrantyResolutionJobId: string | null;
        resolutionAction: import("@prisma/client").$Enums.DisputeResolutionAction | null;
        refundTransactionId: string | null;
        firstResponseAt: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        resolvedById: string | null;
    }>;
    createStaffTicket(tenantId: string, staffUserId: string, staffName: string, createDto: CreateStaffTicketDto): Promise<{
        customerRecord: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            tenantId: string;
            address: string | null;
            city: string | null;
        };
        asset: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.AssetStatus;
            tenantId: string;
            customerRecordId: string;
            manufacturer: string | null;
            modelNumber: string | null;
            serialNumber: string | null;
            installDate: Date | null;
            warrantyExpiresAt: Date | null;
            warrantyDocumentUrl: string | null;
        } | null;
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
        } | null;
        assignedStaff: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SupportTicketStatus;
        tenantId: string;
        customerRecordId: string;
        description: string;
        invoiceId: string | null;
        assetId: string | null;
        attachments: string[];
        jobId: string | null;
        type: import("@prisma/client").$Enums.SupportTicketType;
        subject: string;
        priority: import("@prisma/client").$Enums.TicketPriority;
        paymentTransactionId: string | null;
        disputedAmount: import("@prisma/client/runtime/library").Decimal | null;
        disputeReason: import("@prisma/client").$Enums.DisputeReason | null;
        assignedStaffId: string | null;
        resolutionNotes: string | null;
        ticketNumber: string;
        warrantyValidAtFiling: boolean | null;
        warrantyResolutionJobId: string | null;
        resolutionAction: import("@prisma/client").$Enums.DisputeResolutionAction | null;
        refundTransactionId: string | null;
        firstResponseAt: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        resolvedById: string | null;
    }>;
    getTickets(tenantId: string, filterDto: FilterTicketsDto): Promise<{
        data: ({
            customerRecord: {
                name: string;
                id: string;
                email: string | null;
                phone: string | null;
            };
            asset: {
                name: string;
                id: string;
                serialNumber: string | null;
            } | null;
            invoice: {
                id: string;
                status: import("@prisma/client").$Enums.InvoiceStatus;
                title: string;
                amount: import("@prisma/client/runtime/library").Decimal;
            } | null;
            assignedStaff: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
            messages: {
                message: string;
                id: string;
                createdAt: Date;
                senderType: import("@prisma/client").$Enums.MessageSenderType;
                senderName: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.SupportTicketStatus;
            tenantId: string;
            customerRecordId: string;
            description: string;
            invoiceId: string | null;
            assetId: string | null;
            attachments: string[];
            jobId: string | null;
            type: import("@prisma/client").$Enums.SupportTicketType;
            subject: string;
            priority: import("@prisma/client").$Enums.TicketPriority;
            paymentTransactionId: string | null;
            disputedAmount: import("@prisma/client/runtime/library").Decimal | null;
            disputeReason: import("@prisma/client").$Enums.DisputeReason | null;
            assignedStaffId: string | null;
            resolutionNotes: string | null;
            ticketNumber: string;
            warrantyValidAtFiling: boolean | null;
            warrantyResolutionJobId: string | null;
            resolutionAction: import("@prisma/client").$Enums.DisputeResolutionAction | null;
            refundTransactionId: string | null;
            firstResponseAt: Date | null;
            resolvedAt: Date | null;
            closedAt: Date | null;
            resolvedById: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getTicketDetails(tenantId: string, ticketId: string, isCustomerView?: boolean, customerRecordId?: string): Promise<{
        tenant: {
            name: string;
            slug: string;
            id: string;
        };
        customerRecord: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            tenantId: string;
            address: string | null;
            city: string | null;
        };
        asset: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.AssetStatus;
            tenantId: string;
            customerRecordId: string;
            manufacturer: string | null;
            modelNumber: string | null;
            serialNumber: string | null;
            installDate: Date | null;
            warrantyExpiresAt: Date | null;
            warrantyDocumentUrl: string | null;
        } | null;
        invoice: ({
            escrowHold: {
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
            } | null;
            paymentTransactions: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.PaymentTransactionStatus;
                tenantId: string;
                customerRecordId: string | null;
                amount: import("@prisma/client/runtime/library").Decimal;
                invoiceId: string | null;
                type: string;
                currency: string;
                transactionReference: string;
                paymentMethod: string | null;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                gateway: import("@prisma/client").$Enums.PaymentGatewayType;
                gatewayReference: string | null;
            }[];
        } & {
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
        }) | null;
        job: {
            id: string;
            status: import("@prisma/client").$Enums.JobStatus;
            title: string;
            scheduledAt: Date | null;
        } | null;
        paymentTransaction: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PaymentTransactionStatus;
            tenantId: string;
            customerRecordId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            invoiceId: string | null;
            type: string;
            currency: string;
            transactionReference: string;
            paymentMethod: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            gateway: import("@prisma/client").$Enums.PaymentGatewayType;
            gatewayReference: string | null;
        } | null;
        assignedStaff: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        } | null;
        resolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        messages: ({
            senderUser: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            } | null;
        } & {
            message: string;
            id: string;
            createdAt: Date;
            attachments: string[];
            isInternalNote: boolean;
            senderType: import("@prisma/client").$Enums.MessageSenderType;
            senderName: string;
            readAt: Date | null;
            senderUserId: string | null;
            ticketId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SupportTicketStatus;
        tenantId: string;
        customerRecordId: string;
        description: string;
        invoiceId: string | null;
        assetId: string | null;
        attachments: string[];
        jobId: string | null;
        type: import("@prisma/client").$Enums.SupportTicketType;
        subject: string;
        priority: import("@prisma/client").$Enums.TicketPriority;
        paymentTransactionId: string | null;
        disputedAmount: import("@prisma/client/runtime/library").Decimal | null;
        disputeReason: import("@prisma/client").$Enums.DisputeReason | null;
        assignedStaffId: string | null;
        resolutionNotes: string | null;
        ticketNumber: string;
        warrantyValidAtFiling: boolean | null;
        warrantyResolutionJobId: string | null;
        resolutionAction: import("@prisma/client").$Enums.DisputeResolutionAction | null;
        refundTransactionId: string | null;
        firstResponseAt: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        resolvedById: string | null;
    }>;
    addMessage(tenantId: string, ticketId: string, senderInfo: {
        senderType: 'CUSTOMER' | 'STAFF' | 'SYSTEM';
        senderUserId?: string;
        senderCustomerRecordId?: string;
        senderName: string;
    }, createDto: CreateTicketMessageDto): Promise<{
        senderUser: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        } | null;
    } & {
        message: string;
        id: string;
        createdAt: Date;
        attachments: string[];
        isInternalNote: boolean;
        senderType: import("@prisma/client").$Enums.MessageSenderType;
        senderName: string;
        readAt: Date | null;
        senderUserId: string | null;
        ticketId: string;
    }>;
    updateTicketStatus(tenantId: string, ticketId: string, updateDto: UpdateTicketStatusDto, staffUserId?: string): Promise<{
        customerRecord: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            tenantId: string;
            address: string | null;
            city: string | null;
        };
        assignedStaff: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SupportTicketStatus;
        tenantId: string;
        customerRecordId: string;
        description: string;
        invoiceId: string | null;
        assetId: string | null;
        attachments: string[];
        jobId: string | null;
        type: import("@prisma/client").$Enums.SupportTicketType;
        subject: string;
        priority: import("@prisma/client").$Enums.TicketPriority;
        paymentTransactionId: string | null;
        disputedAmount: import("@prisma/client/runtime/library").Decimal | null;
        disputeReason: import("@prisma/client").$Enums.DisputeReason | null;
        assignedStaffId: string | null;
        resolutionNotes: string | null;
        ticketNumber: string;
        warrantyValidAtFiling: boolean | null;
        warrantyResolutionJobId: string | null;
        resolutionAction: import("@prisma/client").$Enums.DisputeResolutionAction | null;
        refundTransactionId: string | null;
        firstResponseAt: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        resolvedById: string | null;
    }>;
    resolveWarrantyClaim(tenantId: string, ticketId: string, resolveDto: ResolveWarrantyDto, staffUserId: string, staffName: string): Promise<{
        tenant: {
            name: string;
            slug: string;
            id: string;
        };
        customerRecord: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            tenantId: string;
            address: string | null;
            city: string | null;
        };
        asset: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.AssetStatus;
            tenantId: string;
            customerRecordId: string;
            manufacturer: string | null;
            modelNumber: string | null;
            serialNumber: string | null;
            installDate: Date | null;
            warrantyExpiresAt: Date | null;
            warrantyDocumentUrl: string | null;
        } | null;
        invoice: ({
            escrowHold: {
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
            } | null;
            paymentTransactions: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.PaymentTransactionStatus;
                tenantId: string;
                customerRecordId: string | null;
                amount: import("@prisma/client/runtime/library").Decimal;
                invoiceId: string | null;
                type: string;
                currency: string;
                transactionReference: string;
                paymentMethod: string | null;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                gateway: import("@prisma/client").$Enums.PaymentGatewayType;
                gatewayReference: string | null;
            }[];
        } & {
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
        }) | null;
        job: {
            id: string;
            status: import("@prisma/client").$Enums.JobStatus;
            title: string;
            scheduledAt: Date | null;
        } | null;
        paymentTransaction: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PaymentTransactionStatus;
            tenantId: string;
            customerRecordId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            invoiceId: string | null;
            type: string;
            currency: string;
            transactionReference: string;
            paymentMethod: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            gateway: import("@prisma/client").$Enums.PaymentGatewayType;
            gatewayReference: string | null;
        } | null;
        assignedStaff: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        } | null;
        resolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        messages: ({
            senderUser: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            } | null;
        } & {
            message: string;
            id: string;
            createdAt: Date;
            attachments: string[];
            isInternalNote: boolean;
            senderType: import("@prisma/client").$Enums.MessageSenderType;
            senderName: string;
            readAt: Date | null;
            senderUserId: string | null;
            ticketId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SupportTicketStatus;
        tenantId: string;
        customerRecordId: string;
        description: string;
        invoiceId: string | null;
        assetId: string | null;
        attachments: string[];
        jobId: string | null;
        type: import("@prisma/client").$Enums.SupportTicketType;
        subject: string;
        priority: import("@prisma/client").$Enums.TicketPriority;
        paymentTransactionId: string | null;
        disputedAmount: import("@prisma/client/runtime/library").Decimal | null;
        disputeReason: import("@prisma/client").$Enums.DisputeReason | null;
        assignedStaffId: string | null;
        resolutionNotes: string | null;
        ticketNumber: string;
        warrantyValidAtFiling: boolean | null;
        warrantyResolutionJobId: string | null;
        resolutionAction: import("@prisma/client").$Enums.DisputeResolutionAction | null;
        refundTransactionId: string | null;
        firstResponseAt: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        resolvedById: string | null;
    }>;
    resolveChargeDispute(tenantId: string, ticketId: string, resolveDto: ResolveDisputeDto, staffUserId: string, staffName: string): Promise<{
        tenant: {
            name: string;
            slug: string;
            id: string;
        };
        customerRecord: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            tenantId: string;
            address: string | null;
            city: string | null;
        };
        asset: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.AssetStatus;
            tenantId: string;
            customerRecordId: string;
            manufacturer: string | null;
            modelNumber: string | null;
            serialNumber: string | null;
            installDate: Date | null;
            warrantyExpiresAt: Date | null;
            warrantyDocumentUrl: string | null;
        } | null;
        invoice: ({
            escrowHold: {
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
            } | null;
            paymentTransactions: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.PaymentTransactionStatus;
                tenantId: string;
                customerRecordId: string | null;
                amount: import("@prisma/client/runtime/library").Decimal;
                invoiceId: string | null;
                type: string;
                currency: string;
                transactionReference: string;
                paymentMethod: string | null;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                gateway: import("@prisma/client").$Enums.PaymentGatewayType;
                gatewayReference: string | null;
            }[];
        } & {
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
        }) | null;
        job: {
            id: string;
            status: import("@prisma/client").$Enums.JobStatus;
            title: string;
            scheduledAt: Date | null;
        } | null;
        paymentTransaction: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PaymentTransactionStatus;
            tenantId: string;
            customerRecordId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            invoiceId: string | null;
            type: string;
            currency: string;
            transactionReference: string;
            paymentMethod: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            gateway: import("@prisma/client").$Enums.PaymentGatewayType;
            gatewayReference: string | null;
        } | null;
        assignedStaff: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        } | null;
        resolvedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        messages: ({
            senderUser: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            } | null;
        } & {
            message: string;
            id: string;
            createdAt: Date;
            attachments: string[];
            isInternalNote: boolean;
            senderType: import("@prisma/client").$Enums.MessageSenderType;
            senderName: string;
            readAt: Date | null;
            senderUserId: string | null;
            ticketId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SupportTicketStatus;
        tenantId: string;
        customerRecordId: string;
        description: string;
        invoiceId: string | null;
        assetId: string | null;
        attachments: string[];
        jobId: string | null;
        type: import("@prisma/client").$Enums.SupportTicketType;
        subject: string;
        priority: import("@prisma/client").$Enums.TicketPriority;
        paymentTransactionId: string | null;
        disputedAmount: import("@prisma/client/runtime/library").Decimal | null;
        disputeReason: import("@prisma/client").$Enums.DisputeReason | null;
        assignedStaffId: string | null;
        resolutionNotes: string | null;
        ticketNumber: string;
        warrantyValidAtFiling: boolean | null;
        warrantyResolutionJobId: string | null;
        resolutionAction: import("@prisma/client").$Enums.DisputeResolutionAction | null;
        refundTransactionId: string | null;
        firstResponseAt: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        resolvedById: string | null;
    }>;
    getSupportMetrics(tenantId: string): Promise<{
        openTickets: number;
        inProgressTickets: number;
        waitingOnCustomer: number;
        activeBillingDisputes: number;
        activeWarrantyClaims: number;
        urgentAttentionRequired: number;
        avgResolutionHours: number;
    }>;
    getCustomerTickets(tenantId: string, customerRecordId: string): Promise<({
        asset: {
            name: string;
            id: string;
            serialNumber: string | null;
        } | null;
        invoice: {
            id: string;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            title: string;
            amount: import("@prisma/client/runtime/library").Decimal;
        } | null;
        messages: {
            message: string;
            id: string;
            createdAt: Date;
            senderName: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SupportTicketStatus;
        tenantId: string;
        customerRecordId: string;
        description: string;
        invoiceId: string | null;
        assetId: string | null;
        attachments: string[];
        jobId: string | null;
        type: import("@prisma/client").$Enums.SupportTicketType;
        subject: string;
        priority: import("@prisma/client").$Enums.TicketPriority;
        paymentTransactionId: string | null;
        disputedAmount: import("@prisma/client/runtime/library").Decimal | null;
        disputeReason: import("@prisma/client").$Enums.DisputeReason | null;
        assignedStaffId: string | null;
        resolutionNotes: string | null;
        ticketNumber: string;
        warrantyValidAtFiling: boolean | null;
        warrantyResolutionJobId: string | null;
        resolutionAction: import("@prisma/client").$Enums.DisputeResolutionAction | null;
        refundTransactionId: string | null;
        firstResponseAt: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        resolvedById: string | null;
    })[]>;
}
