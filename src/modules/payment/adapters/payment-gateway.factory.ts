import { Injectable } from '@nestjs/common';
import { GatewayType, PaymentGatewayAdapter } from './payment-gateway.interface';
import { StripeAdapter } from './stripe.adapter';
import { PaystackAdapter } from './paystack.adapter';
import { FlutterwaveAdapter } from './flutterwave.adapter';

@Injectable()
export class PaymentGatewayFactory {
  constructor(
    private readonly stripeAdapter: StripeAdapter,
    private readonly paystackAdapter: PaystackAdapter,
    private readonly flutterwaveAdapter: FlutterwaveAdapter,
  ) {}

  getAdapter(gateway: GatewayType): PaymentGatewayAdapter {
    switch (gateway) {
      case 'STRIPE':
        return this.stripeAdapter;
      case 'PAYSTACK':
        return this.paystackAdapter;
      case 'FLUTTERWAVE':
        return this.flutterwaveAdapter;
      default:
        return this.stripeAdapter;
    }
  }

  resolveAdapter(tenantSettings?: any, currency?: string): PaymentGatewayAdapter {
    const configuredGateway = tenantSettings?.payments?.gateway as GatewayType | undefined;
    if (configuredGateway) {
      return this.getAdapter(configuredGateway);
    }

    // Auto-resolve by currency/region
    const curr = (currency || tenantSettings?.businessProfile?.currency || 'USD').toUpperCase();
    if (curr === 'NGN') {
      return this.paystackAdapter;
    }
    if (['KES', 'GHS', 'ZAR', 'UGX'].includes(curr)) {
      return this.flutterwaveAdapter;
    }

    return this.stripeAdapter;
  }
}
