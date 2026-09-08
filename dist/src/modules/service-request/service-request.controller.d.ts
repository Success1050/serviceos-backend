import { ServiceRequestService } from './service-request.service';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
export declare class ServiceRequestController {
    private readonly serviceRequestService;
    constructor(serviceRequestService: ServiceRequestService);
    findAll(user: any): Promise<({
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
        status: import("@prisma/client").$Enums.ServiceRequestStatus;
        tenantId: string;
        customerRecordId: string;
        description: string;
        assetId: string | null;
        jobId: string | null;
    })[]>;
    updateStatus(user: any, requestId: string, updateDto: UpdateServiceRequestStatusDto): Promise<{
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
}
