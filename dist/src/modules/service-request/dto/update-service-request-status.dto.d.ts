import { ServiceRequestStatus } from '@prisma/client';
export declare class UpdateServiceRequestStatusDto {
    status: ServiceRequestStatus;
    jobId?: string;
}
