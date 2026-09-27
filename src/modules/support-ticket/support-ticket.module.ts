import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentModule } from '../payment/payment.module';
import { SupportTicketController } from './support-ticket.controller';
import { SupportTicketService } from './support-ticket.service';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    forwardRef(() => PaymentModule),
  ],
  controllers: [SupportTicketController],
  providers: [SupportTicketService],
  exports: [SupportTicketService],
})
export class SupportTicketModule {}
