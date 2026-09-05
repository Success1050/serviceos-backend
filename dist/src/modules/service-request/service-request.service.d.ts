import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
export declare class ServiceRequestService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createRequest(tenantId: string, customerRecordId: string, createDto: CreateServiceRequestDto): Promise<{
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
    getRequests(tenantId: string): Promise<({
        customerRecord: {
            name: string;
            phone: string | null;
        };
        asset: {
            name: string;
            serialNumber: string | null;
            warrantyExpiresAt: Date | null;
        } | null;
        job: {
            status: import("@prisma/client").$Enums.JobStatus;
            title: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.ServiceRequestStatus;
        description: string;
        assetId: string | null;
        jobId: string | null;
    })[]>;
    updateStatus(tenantId: string, requestId: string, updateDto: UpdateServiceRequestStatusDto): Promise<{
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
}
