import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { MaintenanceService } from '../maintenance.service';

@Processor('maintenance-queue')
export class MaintenanceProcessor {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Process('generate-due-jobs')
  async handleGenerateJobs(job: Job) {
    console.log(`[Bull] Processing generate-due-jobs...`);
    const result = await this.maintenanceService.generateJobsForDueSchedules();
    console.log(`[Bull] Completed generate-due-jobs. Generated ${result.processed} jobs.`);
    return result;
  }
}
