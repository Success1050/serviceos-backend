import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceScheduleDto } from './dto/create-schedule.dto';
export declare class MaintenanceController {
    private readonly maintenanceService;
    constructor(maintenanceService: MaintenanceService);
    getUpcoming(user: any, days?: string): Promise<({
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
        status: import("@prisma/client").$Enums.ScheduleStatus;
        tenantId: string;
        customerRecordId: string;
        title: string;
        assetId: string | null;
        intervalMonths: number;
        nextDueDate: Date;
        currentJobId: string | null;
    })[]>;
    createSchedule(user: any, customerId: string, dto: CreateMaintenanceScheduleDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ScheduleStatus;
        tenantId: string;
        customerRecordId: string;
        title: string;
        assetId: string | null;
        intervalMonths: number;
        nextDueDate: Date;
        currentJobId: string | null;
    }>;
    completeCycle(user: any, scheduleId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ScheduleStatus;
        tenantId: string;
        customerRecordId: string;
        title: string;
        assetId: string | null;
        intervalMonths: number;
        nextDueDate: Date;
        currentJobId: string | null;
    }>;
}
