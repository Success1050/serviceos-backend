import type { Job } from 'bull';
import { MaintenanceService } from '../maintenance.service';
export declare class MaintenanceProcessor {
    private readonly maintenanceService;
    constructor(maintenanceService: MaintenanceService);
    handleGenerateJobs(job: Job): Promise<{
        processed: number;
        jobs: string[];
    }>;
}
