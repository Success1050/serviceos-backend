import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
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
    }>;
    findAll(user: any): Promise<({
        customerRecord: {
            name: string;
            address: string | null;
        };
        assignedTechnician: {
            firstName: string;
            lastName: string;
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
    })[]>;
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
        completionOtp: string | null;
        completionOtpExpiresAt: Date | null;
    }>;
}
