import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  AuthorizeHoldParams,
  CaptureHoldParams,
  GatewayCaptureResult,
  GatewayHoldResult,
  GatewayPaymentResult,
  GatewayReleaseResult,
  GatewayType,
  GatewayVerifyResult,
  InitializePaymentParams,
  PaymentGatewayAdapter,
  ReleaseHoldParams,
  VerifyPaymentParams,
  WebhookEventResult,
} from './payment-gateway.interface';

@Injectable()
export class StripeAdapter implements PaymentGatewayAdapter {
  readonly gatewayName: GatewayType = 'STRIPE';
  private readonly logger = new Logger(StripeAdapter.name);
  private readonly apiKey: string | null;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('STRIPE_SECRET_KEY') || null;
  }

  private get isConfigured(): boolean {
    return !!this.apiKey && !this.apiKey.includes('mock');
  }

  async authorizeHold(params: AuthorizeHoldParams): Promise<GatewayHoldResult> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day card hold

    if (!this.isConfigured) {
      this.logger.log(`[STRIPE MOCK] Card Pre-Auth Hold of ${params.amount} ${params.currency} placed for ${params.customerEmail}.`);
      return {
        success: true,
        authorizationId: `pi_mock_hold_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        status: 'HELD',
        expiresAt,
        rawResponse: { mode: 'mock', amount: params.amount, currency: params.currency },
      };
    }

    try {
      const amountInCents = Math.round(params.amount * 100);
      const postData = new URLSearchParams({
        amount: amountInCents.toString(),
        currency: params.currency.toLowerCase(),
        capture_method: 'manual', // Auth & Capture: holds funds up to 7 days
        'payment_method_types[]': 'card',
        description: `ServiceOS 24h Pre-arrival Hold for ${params.customerEmail}`,
      });

      if (params.paymentMethodToken) {
        postData.append('payment_method', params.paymentMethodToken);
        postData.append('confirm', 'true');
      }

      const response = await axios.post('https://api.stripe.com/v1/payment_intents', postData.toString(), {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        success: true,
        authorizationId: response.data.id,
        status: 'HELD',
        expiresAt,
        rawResponse: response.data,
      };
    } catch (error: any) {
      this.logger.error(`Stripe authorizeHold failed: ${error.response?.data?.error?.message || error.message}`);
      return {
        success: false,
        authorizationId: '',
        status: 'FAILED',
        failureReason: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async captureHold(params: CaptureHoldParams): Promise<GatewayCaptureResult> {
    const capturedAt = new Date();

    if (!this.isConfigured || params.authorizationId.startsWith('pi_mock')) {
      this.logger.log(`[STRIPE MOCK] Captured ${params.amount} ${params.currency} on auth ${params.authorizationId}`);
      return {
        success: true,
        transactionReference: `ch_mock_${Date.now()}`,
        status: 'CAPTURED',
        capturedAt,
        rawResponse: { mode: 'mock', capturedAmount: params.amount },
      };
    }

    try {
      const amountInCents = Math.round(params.amount * 100);
      const postData = new URLSearchParams({
        amount_to_capture: amountInCents.toString(),
      });

      const response = await axios.post(
        `https://api.stripe.com/v1/payment_intents/${params.authorizationId}/capture`,
        postData.toString(),
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return {
        success: true,
        transactionReference: response.data.id,
        status: 'CAPTURED',
        capturedAt,
        rawResponse: response.data,
      };
    } catch (error: any) {
      this.logger.error(`Stripe captureHold failed: ${error.response?.data?.error?.message || error.message}`);
      return {
        success: false,
        transactionReference: params.authorizationId,
        status: 'FAILED',
        failureReason: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async releaseHold(params: ReleaseHoldParams): Promise<GatewayReleaseResult> {
    const releasedAt = new Date();

    if (!this.isConfigured || params.authorizationId.startsWith('pi_mock')) {
      this.logger.log(`[STRIPE MOCK] Released hold ${params.authorizationId}`);
      return {
        success: true,
        status: 'RELEASED',
        releasedAt,
        rawResponse: { mode: 'mock' },
      };
    }

    try {
      const response = await axios.post(
        `https://api.stripe.com/v1/payment_intents/${params.authorizationId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return {
        success: true,
        status: 'RELEASED',
        releasedAt,
        rawResponse: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'FAILED',
        failureReason: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async initializePayment(params: InitializePaymentParams): Promise<GatewayPaymentResult> {
    const ref = `st_ref_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    if (!this.isConfigured) {
      return {
        success: true,
        transactionReference: ref,
        paymentUrl: `https://checkout.stripe.mock/pay/${ref}`,
        rawResponse: { mode: 'mock' },
      };
    }

    try {
      const amountInCents = Math.round(params.amount * 100);
      const postData = new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': params.currency.toLowerCase(),
        'line_items[0][price_data][unit_amount]': amountInCents.toString(),
        'line_items[0][price_data][product_data][name]': params.metadata?.title || 'ServiceOS Service Fee',
        'line_items[0][quantity]': '1',
        mode: 'payment',
        success_url: params.callbackUrl || 'https://serviceos.com/success',
        cancel_url: params.callbackUrl || 'https://serviceos.com/cancel',
        customer_email: params.customerEmail,
        client_reference_id: ref,
      });

      const response = await axios.post('https://api.stripe.com/v1/checkout/sessions', postData.toString(), {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        success: true,
        transactionReference: response.data.id,
        paymentUrl: response.data.url,
        rawResponse: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionReference: ref,
        rawResponse: error.response?.data || error.message,
      };
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<GatewayVerifyResult> {
    if (!this.isConfigured || params.transactionReference.startsWith('st_ref_')) {
      return {
        success: true,
        amount: 100,
        currency: 'USD',
        status: 'SUCCESSFUL',
        paymentMethod: 'CARD',
      };
    }

    try {
      const response = await axios.get(`https://api.stripe.com/v1/payment_intents/${params.transactionReference}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const pi = response.data;
      return {
        success: pi.status === 'succeeded',
        amount: pi.amount / 100,
        currency: pi.currency.toUpperCase(),
        status: pi.status === 'succeeded' ? 'SUCCESSFUL' : 'FAILED',
        paymentMethod: pi.payment_method_types?.[0] || 'CARD',
        rawResponse: pi,
      };
    } catch (error: any) {
      return {
        success: false,
        amount: 0,
        currency: 'USD',
        status: 'FAILED',
        rawResponse: error.response?.data || error.message,
      };
    }
  }

  async handleWebhook(payload: any): Promise<WebhookEventResult> {
    const event = payload.type;
    const object = payload.data?.object;

    if (event === 'payment_intent.succeeded') {
      return {
        event,
        reference: object.id,
        amount: object.amount / 100,
        status: 'SUCCESSFUL',
        metadata: object.metadata,
        rawEvent: payload,
      };
    }

    return {
      event,
      reference: object?.id || 'unknown',
      status: 'IGNORED',
      rawEvent: payload,
    };
  }
}
