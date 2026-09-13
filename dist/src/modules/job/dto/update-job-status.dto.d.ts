import { JobStatus } from '@prisma/client';
export declare class UpdateJobStatusDto {
    status: JobStatus;
    latitude?: number;
    longitude?: number;
    otp?: string;
}
