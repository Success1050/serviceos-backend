import { Module } from '@nestjs/common';
import { PortalService } from './portal.service';
import { PortalController } from './portal.controller';
import { ServiceRequestModule } from '../service-request/service-request.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ServiceRequestModule, NotificationModule],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
