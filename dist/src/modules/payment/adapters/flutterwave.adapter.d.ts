import { ConfigService } from '@nestjs/config';
import { AuthorizeHoldParams, CaptureHoldParams, GatewayCaptureResult, GatewayHoldResult, GatewayPaymentResult, GatewayReleaseResult, GatewayType, GatewayVerifyResult, InitializePaymentParams, PaymentGatewayAdapter, ReleaseHoldParams, VerifyPaymentParams, WebhookEventResult } from './payment-gateway.interface';
export declare class FlutterwaveAdapter implements PaymentGatewayAdapter {
    private readonly configService;
    readonly gatewayName: GatewayType;
    private readonly logger;
    private readonly secretKey;
    constructor(configService: ConfigService);
    private get isConfigured();
    authorizeHold(params: AuthorizeHoldParams): Promise<GatewayHoldResult>;
    captureHold(params: CaptureHoldParams): Promise<GatewayCaptureResult>;
    releaseHold(params: ReleaseHoldParams): Promise<GatewayReleaseResult>;
    initializePayment(params: InitializePaymentParams): Promise<GatewayPaymentResult>;
    verifyPayment(params: VerifyPaymentParams): Promise<GatewayVerifyResult>;
    handleWebhook(payload: any): Promise<WebhookEventResult>;
}
