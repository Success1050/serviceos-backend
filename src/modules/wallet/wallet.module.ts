import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentModule } from '../payment/payment.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PayoutService } from './services/payout.service';
import { SplitSettlementService } from './services/split-settlement.service';
import { PaystackAdapter } from '../payment/adapters/paystack.adapter';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    forwardRef(() => PaymentModule),
  ],
  controllers: [WalletController],
  providers: [
    WalletService,
    PayoutService,
    SplitSettlementService,
    PaystackAdapter,
  ],
  exports: [
    WalletService,
    PayoutService,
    SplitSettlementService,
  ],
})
export class WalletModule {}
