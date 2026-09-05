import { PortalService } from './portal.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CreateServiceRequestDto } from '../service-request/dto/create-service-request.dto';
export declare class PortalController {
    private readonly portalService;
    constructor(portalService: PortalService);
    createServiceRequest(slug: string, user: any, createDto: CreateServiceRequestDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.ServiceRequestStatus;
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
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.QuoteStatus;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    acceptQuote(slug: string, quoteId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.QuoteStatus;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
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
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        title: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        jobId: string | null;
        dueDate: Date | null;
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
            tenantId: string;
            customerRecordId: string;
            status: import("@prisma/client").$Enums.QuoteStatus;
            title: string;
            amount: import("@prisma/client/runtime/library").Decimal;
        }[];
        invoices: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            customerRecordId: string;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            title: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            jobId: string | null;
            dueDate: Date | null;
            paidAt: Date | null;
        }[];
        jobs: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            customerRecordId: string;
            status: import("@prisma/client").$Enums.JobStatus;
            title: string;
            description: string | null;
            quoteId: string | null;
            assignedTechnicianId: string | null;
            scheduledAt: Date | null;
            startedAt: Date | null;
            completedAt: Date | null;
        }[];
        assets: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            customerRecordId: string;
            status: import("@prisma/client").$Enums.AssetStatus;
            manufacturer: string | null;
            modelNumber: string | null;
            serialNumber: string | null;
            installDate: Date | null;
            warrantyExpiresAt: Date | null;
            warrantyDocumentUrl: string | null;
        }[];
    }>;
}
