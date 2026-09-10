import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class MaintenanceCronService {
  private readonly logger = new Logger(MaintenanceCronService.name);

  constructor(@InjectQueue('maintenance-queue') private readonly maintenanceQueue: Queue) {}

  // In production, this might be CronExpression.EVERY_DAY_AT_MIDNIGHT
  // For dev/testing, let's run it every 5 minutes or leave it as midnight.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Cron triggered: Queuing generate-due-jobs...');
    await this.maintenanceQueue.add('generate-due-jobs', {});
  }
}
