import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
export declare class JobController {
    private readonly jobService;
    constructor(jobService: JobService);
    create(user: any, createJobDto: CreateJobDto): Promise<{
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
    findAll(user: any): Promise<{
        customerRecord: {
            name: string;
            address: string | null;
        };
        assignedTechnician: {
            firstName: string;
            lastName: string;
        } | null;
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
        completionOtpExpiresAt: Date | null;
        paymentHoldStatus: string | null;
    }[]>;
    updateStatus(user: any, jobId: string, updateDto: UpdateJobStatusDto): Promise<{
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
        completionOtpExpiresAt: Date | null;
        paymentHoldStatus: string | null;
    }>;
    updateLocation(user: any, jobId: string, locationDto: UpdateLocationDto): Promise<{
        success: boolean;
        jobId: string;
        technician: {
            id: string;
            firstName: string;
            lastName: string;
            lastKnownLatitude: number | null;
            lastKnownLongitude: number | null;
            lastLocationUpdate: Date | null;
        };
        timestamp: Date;
    }>;
}
