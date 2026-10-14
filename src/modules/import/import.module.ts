import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { CustomerImportProcessor } from './processors/customer-import.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'customer-import-queue',
    }),
  ],
  controllers: [ImportController],
  providers: [ImportService, CustomerImportProcessor],
  exports: [ImportService],
})
export class ImportModule {}
