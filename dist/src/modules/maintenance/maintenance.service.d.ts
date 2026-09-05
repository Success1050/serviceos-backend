import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateMaintenanceScheduleDto } from './dto/create-schedule.dto';
export declare class MaintenanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createSchedule(tenantId: string, customerRecordId: string, dto: CreateMaintenanceScheduleDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.ScheduleStatus;
        title: string;
        assetId: string | null;
        intervalMonths: number;
        nextDueDate: Date;
        currentJobId: string | null;
    }>;
    getUpcomingMaintenance(tenantId: string, daysLookahead?: number): Promise<({
        customerRecord: {
            name: string;
            phone: string | null;
            address: string | null;
        };
        asset: {
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.ScheduleStatus;
        title: string;
        assetId: string | null;
        intervalMonths: number;
        nextDueDate: Date;
        currentJobId: string | null;
    })[]>;
    generateJobsForDueSchedules(): Promise<{
        processed: number;
        jobs: string[];
    }>;
    completeMaintenanceCycle(tenantId: string, scheduleId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        customerRecordId: string;
        status: import("@prisma/client").$Enums.ScheduleStatus;
        title: string;
        assetId: string | null;
        intervalMonths: number;
        nextDueDate: Date;
        currentJobId: string | null;
    }>;
}
