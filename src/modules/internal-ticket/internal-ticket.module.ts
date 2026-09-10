import { Module } from '@nestjs/common';
import { InternalTicketService } from './internal-ticket.service';
import { InternalTicketController } from './internal-ticket.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [InternalTicketService],
  controllers: [InternalTicketController]
})
export class InternalTicketModule {}
