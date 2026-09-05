import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceProcessor } from './processors/maintenance.processor';
import { MaintenanceCronService } from './maintenance.cron';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'maintenance-queue',
    }),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceProcessor, MaintenanceCronService],
})
export class MaintenanceModule {}
