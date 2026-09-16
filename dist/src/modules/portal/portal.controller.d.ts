import { PortalService } from './portal.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CreateServiceRequestDto } from '../service-request/dto/create-service-request.dto';
import { AcceptQuoteDto } from './dto/accept-quote.dto';
export declare class PortalController {
    private readonly portalService;
    constructor(portalService: PortalService);
    createServiceRequest(slug: string, user: any, createDto: CreateServiceRequestDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ServiceRequestStatus;
        tenantId: string;
        customerRecordId: string;
        description: string;
        assetId: string | null;
        jobId: string | null;
    }>;
    getQuote(slug: string, quoteId: string): Promise<{
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
    acceptQuote(slug: string, quoteId: string, acceptDto: AcceptQuoteDto, req: any): Promise<{
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
    getInvoice(slug: string, invoiceId: string): Promise<{
        tenant: {
            name: string;
        };
        customerRecord: {
            name: string;
            email: string | null;
            address: string | null;
        };
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
    requestOtp(slug: string, requestOtpDto: RequestOtpDto): Promise<{
        message: string;
    }>;
    verifyOtp(slug: string, verifyOtpDto: VerifyOtpDto): Promise<{
        message: string;
        accessToken: string;
        tenantName: string;
    }>;
    getDashboard(slug: string, user: any): Promise<{
        tenantName: string;
        profile: {
            name: string;
            email: string | null;
            phone: string | null;
            address: string | null;
        };
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
        jobs: {
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
        }[];
        assets: {
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
        }[];
    }>;
}
