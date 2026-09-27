import { PrismaService } from '../../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ServiceRequestService } from '../service-request/service-request.service';
import { CreateServiceRequestDto } from '../service-request/dto/create-service-request.dto';
import { NotificationService } from '../notification/notification.service';
import { LiveTrackingResponseDto } from './dto/live-tracking.dto';
import { SupportTicketService } from '../support-ticket/support-ticket.service';
import { CreateCustomerTicketDto } from '../support-ticket/dto/create-customer-ticket.dto';
import { CreateTicketMessageDto } from '../support-ticket/dto/create-ticket-message.dto';
export declare class PortalService {
    private readonly prisma;
    private readonly configService;
    private readonly serviceRequestService;
    private readonly notificationService;
    private readonly supportTicketService;
    private readonly jwtSecret;
    constructor(prisma: PrismaService, configService: ConfigService, serviceRequestService: ServiceRequestService, notificationService: NotificationService, supportTicketService: SupportTicketService);
    private validateCustomerRelationship;
    createServiceRequest(tenantId: string, relationshipId: string, createDto: CreateServiceRequestDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ServiceRequestStatus;
        tenantId: string;
        customerRecordId: string;
        description: string;
        assetId: string | null;
        urgency: import("@prisma/client").$Enums.UrgencyLevel;
        preferredDate: Date | null;
        preferredTimeSlot: string | null;
        attachments: string[];
        jobId: string | null;
    }>;
    getCustomerServiceRequests(tenantId: string, relationshipId: string): Promise<({
        asset: {
            name: string;
            id: string;
            modelNumber: string | null;
            serialNumber: string | null;
            warrantyExpiresAt: Date | null;
        } | null;
        job: {
            id: string;
            status: import("@prisma/client").$Enums.JobStatus;
            title: string;
            scheduledAt: Date | null;
            assignedTechnician: {
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                rating: number | null;
            } | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ServiceRequestStatus;
        tenantId: string;
        customerRecordId: string;
        description: string;
        assetId: string | null;
        urgency: import("@prisma/client").$Enums.UrgencyLevel;
        preferredDate: Date | null;
        preferredTimeSlot: string | null;
        attachments: string[];
        jobId: string | null;
    })[]>;
    getLiveJobTracking(tenantId: string, relationshipId: string, jobId: string): Promise<LiveTrackingResponseDto>;
    private calculateHaversineDistanceKm;
    getInvoicesHistory(tenantId: string, relationshipId: string): Promise<{
        isPaid: boolean;
        isOverdue: boolean;
        job: {
            id: string;
            status: import("@prisma/client").$Enums.JobStatus;
            title: string;
            completedAt: Date | null;
        } | null;
        quoteMilestone: {
            id: string;
            status: import("@prisma/client").$Enums.MilestoneStatus;
            title: string;
            percentage: import("@prisma/client/runtime/library").Decimal;
        } | null;
        paymentTransactions: {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.PaymentTransactionStatus;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            transactionReference: string;
            paymentMethod: string | null;
            gateway: import("@prisma/client").$Enums.PaymentGatewayType;
        }[];
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
    }[]>;
    getInvoiceDetails(tenantId: string, relationshipId: string, invoiceId: string): Promise<{
        tenant: {
            name: string;
            slug: string;
            id: string;
        };
        customerRecord: {
            name: string;
            id: string;
            email: string | null;
            phone: string | null;
            address: string | null;
        };
        job: {
            id: string;
            status: import("@prisma/client").$Enums.JobStatus;
            description: string | null;
            title: string;
            completedAt: Date | null;
            assignedTechnician: {
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            } | null;
        } | null;
        quoteMilestone: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.MilestoneStatus;
            tenantId: string;
            title: string;
            percentage: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal;
            order: number;
            dueDate: Date | null;
            quoteId: string;
            invoiceId: string | null;
        } | null;
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
    }>;
    getJobsHistory(tenantId: string, relationshipId: string): Promise<({
        invoices: {
            id: string;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            title: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            paidAt: Date | null;
        }[];
        serviceRequests: {
            id: string;
            status: import("@prisma/client").$Enums.ServiceRequestStatus;
            description: string;
            urgency: import("@prisma/client").$Enums.UrgencyLevel;
        }[];
        assignedTechnician: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
            bio: string | null;
            certifications: string[];
            rating: number | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.JobStatus;
        tenantId: string;
        customerRecordId: string;
        description: string | null;
        title: string;
        quoteId: string | null;
        assignedTechnicianId: string | null;
        scheduledAt: Date | null;
        estimatedDuration: number;
        enRouteAt: Date | null;
        startedAt: Date | null;
        completedAt: Date | null;
        completionOtp: string | null;
        completionOtpExpiresAt: Date | null;
        paymentHoldStatus: string | null;
    })[]>;
    getJobDetails(tenantId: string, relationshipId: string, jobId: string): Promise<{
        quote: ({
            milestones: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.MilestoneStatus;
                tenantId: string;
                title: string;
                percentage: import("@prisma/client/runtime/library").Decimal;
                amount: import("@prisma/client/runtime/library").Decimal;
                order: number;
                dueDate: Date | null;
                quoteId: string;
                invoiceId: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.QuoteStatus;
            tenantId: string;
            customerRecordId: string;
            title: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            billingType: import("@prisma/client").$Enums.BillingType;
            termsAndConditions: string | null;
            signedTermsAt: Date | null;
            signerName: string | null;
            signerIp: string | null;
            signatureData: string | null;
        }) | null;
        invoices: ({
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
        })[];
        serviceRequests: ({
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
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ServiceRequestStatus;
            tenantId: string;
            customerRecordId: string;
            description: string;
            assetId: string | null;
            urgency: import("@prisma/client").$Enums.UrgencyLevel;
            preferredDate: Date | null;
            preferredTimeSlot: string | null;
            attachments: string[];
            jobId: string | null;
        })[];
        assignedTechnician: {
            id: string;
            phone: string | null;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
            bio: string | null;
            certifications: string[];
            rating: number | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.JobStatus;
        tenantId: string;
        customerRecordId: string;
        description: string | null;
        title: string;
        quoteId: string | null;
        assignedTechnicianId: string | null;
        scheduledAt: Date | null;
        estimatedDuration: number;
        enRouteAt: Date | null;
        startedAt: Date | null;
        completedAt: Date | null;
        completionOtp: string | null;
        completionOtpExpiresAt: Date | null;
        paymentHoldStatus: string | null;
    }>;
    getAssetsHistory(tenantId: string, relationshipId: string): Promise<{
        warranty: {
            isActive: boolean;
            expiresAt: Date | null;
            daysRemaining: number | null;
            documentUrl: string | null;
        };
        serviceRequests: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ServiceRequestStatus;
            tenantId: string;
            customerRecordId: string;
            description: string;
            assetId: string | null;
            urgency: import("@prisma/client").$Enums.UrgencyLevel;
            preferredDate: Date | null;
            preferredTimeSlot: string | null;
            attachments: string[];
            jobId: string | null;
        }[];
        maintenanceSchedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ScheduleStatus;
            tenantId: string;
            customerRecordId: string;
            title: string;
            assetId: string | null;
            nextDueDate: Date;
            intervalMonths: number;
            currentJobId: string | null;
        }[];
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
    }[]>;
    getAssetDetails(tenantId: string, relationshipId: string, assetId: string): Promise<{
        warranty: {
            isActive: boolean;
            expiresAt: Date | null;
            daysRemaining: number | null;
            documentUrl: string | null;
        };
        serviceRequests: ({
            job: {
                id: string;
                status: import("@prisma/client").$Enums.JobStatus;
                title: string;
                completedAt: Date | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ServiceRequestStatus;
            tenantId: string;
            customerRecordId: string;
            description: string;
            assetId: string | null;
            urgency: import("@prisma/client").$Enums.UrgencyLevel;
            preferredDate: Date | null;
            preferredTimeSlot: string | null;
            attachments: string[];
            jobId: string | null;
        })[];
        maintenanceSchedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ScheduleStatus;
            tenantId: string;
            customerRecordId: string;
            title: string;
            assetId: string | null;
            nextDueDate: Date;
            intervalMonths: number;
            currentJobId: string | null;
        }[];
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
    }>;
    getDashboard(tenantId: string, relationshipId: string): Promise<{
        tenantName: string;
        profile: {
            name: string;
            email: string | null;
            phone: string | null;
            address: string | null;
        };
        activeJob: {
            id: string;
            title: string;
            status: import("@prisma/client").$Enums.JobStatus;
            technician: {
                phone: string | null;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                rating: number | null;
            } | null;
            liveTrackingAvailable: boolean;
        } | null;
        quotes: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.QuoteStatus;
            tenantId: string;
            customerRecordId: string;
            title: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            billingType: import("@prisma/client").$Enums.BillingType;
            termsAndConditions: string | null;
            signedTermsAt: Date | null;
            signerName: string | null;
            signerIp: string | null;
            signatureData: string | null;
        }[];
        invoices: {
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
        }[];
        jobs: ({
            assignedTechnician: {
                phone: string | null;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                rating: number | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.JobStatus;
            tenantId: string;
            customerRecordId: string;
            description: string | null;
            title: string;
            quoteId: string | null;
            assignedTechnicianId: string | null;
            scheduledAt: Date | null;
            estimatedDuration: number;
            enRouteAt: Date | null;
            startedAt: Date | null;
            completedAt: Date | null;
            completionOtp: string | null;
            completionOtpExpiresAt: Date | null;
            paymentHoldStatus: string | null;
        })[];
        assets: ({
            maintenanceSchedules: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.ScheduleStatus;
                tenantId: string;
                customerRecordId: string;
                title: string;
                assetId: string | null;
                nextDueDate: Date;
                intervalMonths: number;
                currentJobId: string | null;
            }[];
        } & {
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
        })[];
        serviceRequests: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ServiceRequestStatus;
            tenantId: string;
            customerRecordId: string;
            description: string;
            assetId: string | null;
            urgency: import("@prisma/client").$Enums.UrgencyLevel;
            preferredDate: Date | null;
            preferredTimeSlot: string | null;
            attachments: string[];
            jobId: string | null;
        }[];
        supportTickets: ({
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
    }>;
    requestOtp(slug: string, phone: string): Promise<{
        message: string;
    }>;
    verifyOtp(slug: string, phone: string, code: string): Promise<{
        message: string;
        accessToken: string;
        tenantName: string;
        customerName: string;
    }>;
    getQuoteForCustomer(slug: string, quoteId: string): Promise<{
        tenant: {
            name: string;
        };
        customerRecord: {
            name: string;
            email: string | null;
            address: string | null;
        };
        milestones: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.MilestoneStatus;
            tenantId: string;
            title: string;
            percentage: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal;
            order: number;
            dueDate: Date | null;
            quoteId: string;
            invoiceId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        tenantId: string;
        customerRecordId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        billingType: import("@prisma/client").$Enums.BillingType;
        termsAndConditions: string | null;
        signedTermsAt: Date | null;
        signerName: string | null;
        signerIp: string | null;
        signatureData: string | null;
    }>;
    acceptQuote(slug: string, quoteId: string, acceptDto?: any, clientIp?: string): Promise<{
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
        milestones: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.MilestoneStatus;
            tenantId: string;
            title: string;
            percentage: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal;
            order: number;
            dueDate: Date | null;
            quoteId: string;
            invoiceId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        tenantId: string;
        customerRecordId: string;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        billingType: import("@prisma/client").$Enums.BillingType;
        termsAndConditions: string | null;
        signedTermsAt: Date | null;
        signerName: string | null;
        signerIp: string | null;
        signatureData: string | null;
    }>;
    getInvoiceForCustomer(slug: string, invoiceId: string): Promise<{
        tenant: {
            name: string;
        };
        customerRecord: {
            name: string;
            email: string | null;
            address: string | null;
        };
        job: {
            status: import("@prisma/client").$Enums.JobStatus;
            title: string;
        } | null;
        quoteMilestone: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.MilestoneStatus;
            tenantId: string;
            title: string;
            percentage: import("@prisma/client/runtime/library").Decimal;
            amount: import("@prisma/client/runtime/library").Decimal;
            order: number;
            dueDate: Date | null;
            quoteId: string;
            invoiceId: string | null;
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
    }>;
    createSupportTicket(tenantId: string, relationshipId: string, createDto: CreateCustomerTicketDto): Promise<{
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
    getCustomerSupportTickets(tenantId: string, relationshipId: string): Promise<({
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
    getSupportTicketDetails(tenantId: string, relationshipId: string, ticketId: string): Promise<{
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
    postTicketMessage(tenantId: string, relationshipId: string, ticketId: string, createMessageDto: CreateTicketMessageDto): Promise<{
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
    closeCustomerTicket(tenantId: string, relationshipId: string, ticketId: string): Promise<{
        message: string;
        ticketId: string;
    }>;
}
