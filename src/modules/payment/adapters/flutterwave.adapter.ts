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
export class FlutterwaveAdapter implements PaymentGatewayAdapter {
  readonly gatewayName: GatewayType = 'FLUTTERWAVE';
  private readonly logger = new Logger(FlutterwaveAdapter.name);
  private readonly secretKey: string | null;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY') || null;
  }

  private get isConfigured(): boolean {
    return !!this.secretKey && !this.secretKey.includes('mock');
  }

  async authorizeHold(params: AuthorizeHoldParams): Promise<GatewayHoldResult> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (!this.isConfigured) {
      this.logger.log(`[FLUTTERWAVE MOCK] Pre-auth hold of ${params.amount} ${params.currency} placed.`);
      return {
        success: true,
        authorizationId: `flw_auth_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        status: 'HELD',
        expiresAt,
        rawResponse: { mode: 'mock', amount: params.amount },
      };
    }

    try {
      // Flutterwave pre-authorization endpoint
      const response = await axios.post(
        'https://api.flutterwave.com/v3/charges?type=card',
        {
          token: params.paymentMethodToken,
          currency: params.currency || 'USD',
          amount: params.amount,
          email: params.customerEmail,
          tx_ref: `flw_preauth_${Date.now()}`,
          auth_model: 'AUTH', // Pre-authorization mode
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: response.data.status === 'success',
        authorizationId: response.data.data?.flw_ref || response.data.data?.id?.toString(),
        status: 'HELD',
        expiresAt,
        rawResponse: response.data,
      };
    } catch (error: any) {
      this.logger.error(`Flutterwave authorizeHold failed: ${error.response?.data?.message || error.message}`);
      return {
        success: false,
        authorizationId: '',
        status: 'FAILED',
        failureReason: error.response?.data?.message || error.message,
      };
    }
  }

  async captureHold(params: CaptureHoldParams): Promise<GatewayCaptureResult> {
    const capturedAt = new Date();

    if (!this.isConfigured || params.authorizationId.startsWith('flw_auth_')) {
      return {
        success: true,
        transactionReference: params.authorizationId,
        status: 'CAPTURED',
        capturedAt,
        rawResponse: { mode: 'mock' },
      };
    }

    try {
      const response = await axios.post(
        `https://api.flutterwave.com/v3/charges/${params.authorizationId}/capture`,
        { amount: params.amount },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: response.data.status === 'success',
        transactionReference: response.data.data?.id?.toString() || params.authorizationId,
        status: 'CAPTURED',
        capturedAt,
        rawResponse: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionReference: params.authorizationId,
        status: 'FAILED',
        failureReason: error.response?.data?.message || error.message,
      };
    }
  }

  async releaseHold(params: ReleaseHoldParams): Promise<GatewayReleaseResult> {
    const releasedAt = new Date();

    if (!this.isConfigured || params.authorizationId.startsWith('flw_auth_')) {
      return {
        success: true,
        status: 'RELEASED',
        releasedAt,
        rawResponse: { mode: 'mock' },
      };
    }

    try {
      const response = await axios.post(
        `https://api.flutterwave.com/v3/charges/${params.authorizationId}/void`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
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
        failureReason: error.response?.data?.message || error.message,
      };
    }
  }

  async initializePayment(params: InitializePaymentParams): Promise<GatewayPaymentResult> {
    const ref = `flw_ref_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    if (!this.isConfigured) {
      return {
        success: true,
        transactionReference: ref,
        paymentUrl: `https://checkout.flutterwave.mock/pay/${ref}`,
        rawResponse: { mode: 'mock' },
      };
    }

    try {
      const response = await axios.post(
        'https://api.flutterwave.com/v3/payments',
        {
          tx_ref: ref,
          amount: params.amount,
          currency: params.currency || 'USD',
          redirect_url: params.callbackUrl,
          customer: {
            email: params.customerEmail,
            name: params.customerName || 'ServiceOS Client',
          },
          meta: params.metadata,
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: response.data.status === 'success',
        transactionReference: ref,
        paymentUrl: response.data.data?.link,
        rawResponse: response.data.data,
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
    if (!this.isConfigured || params.transactionReference.startsWith('flw_ref_')) {
      return {
        success: true,
        amount: 100,
        currency: 'USD',
        status: 'SUCCESSFUL',
      };
    }

    try {
      const response = await axios.get(
        `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${params.transactionReference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      const data = response.data.data;
      return {
        success: data.status === 'successful',
        amount: data.amount,
        currency: data.currency,
        status: data.status === 'successful' ? 'SUCCESSFUL' : 'FAILED',
        paymentMethod: data.payment_type?.toUpperCase(),
        rawResponse: data,
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
    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.completed' && data?.status === 'successful') {
      return {
        event,
        reference: data.tx_ref,
        amount: data.amount,
        status: 'SUCCESSFUL',
        metadata: data.meta,
        rawEvent: payload,
      };
    }

    return {
      event,
      reference: data?.tx_ref || 'unknown',
      status: 'IGNORED',
      rawEvent: payload,
    };
  }
}
