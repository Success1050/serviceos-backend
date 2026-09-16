import { PrismaService } from '../../core/prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
export declare class JobService {
    private readonly prisma;
    private readonly paymentService;
    constructor(prisma: PrismaService, paymentService: PaymentService);
    createJob(tenantId: string, createJobDto: CreateJobDto): Promise<{
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
    getJobs(tenantId: string, user: any): Promise<{
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
    updateJobStatus(tenantId: string, jobId: string, updateDto: UpdateJobStatusDto, user: any): Promise<{
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
    private checkSchedulingConflicts;
}
