import { GatewayType, PaymentGatewayAdapter } from './payment-gateway.interface';
import { StripeAdapter } from './stripe.adapter';
import { PaystackAdapter } from './paystack.adapter';
import { FlutterwaveAdapter } from './flutterwave.adapter';
export declare class PaymentGatewayFactory {
    private readonly stripeAdapter;
    private readonly paystackAdapter;
    private readonly flutterwaveAdapter;
    constructor(stripeAdapter: StripeAdapter, paystackAdapter: PaystackAdapter, flutterwaveAdapter: FlutterwaveAdapter);
    getAdapter(gateway: GatewayType): PaymentGatewayAdapter;
    resolveAdapter(tenantSettings?: any, currency?: string): PaymentGatewayAdapter;
}
