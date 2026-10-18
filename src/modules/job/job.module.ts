import { Module, forwardRef } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { PaymentModule } from '../payment/payment.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationModule } from '../notification/notification.module';
import { MailModule } from '../../core/mail/mail.module';

@Module({
  imports: [
    PaymentModule,
    forwardRef(() => WalletModule),
    NotificationModule,
    MailModule,
  ],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
