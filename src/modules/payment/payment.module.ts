import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentGatewayFactory } from './adapters/payment-gateway.factory';
import { StripeAdapter } from './adapters/stripe.adapter';
import { PaystackAdapter } from './adapters/paystack.adapter';
import { FlutterwaveAdapter } from './adapters/flutterwave.adapter';
import { EscrowHoldCronService } from './cron/escrow-hold.cron';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentGatewayFactory,
    StripeAdapter,
    PaystackAdapter,
    FlutterwaveAdapter,
    EscrowHoldCronService,
  ],
  exports: [
    PaymentService,
    PaymentGatewayFactory,
  ],
})
export class PaymentModule {}
