import type { Queue } from 'bull';
export declare class MaintenanceCronService {
    private readonly maintenanceQueue;
    private readonly logger;
    constructor(maintenanceQueue: Queue);
    handleCron(): Promise<void>;
}
