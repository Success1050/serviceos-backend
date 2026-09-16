export type GatewayType = 'STRIPE' | 'PAYSTACK' | 'FLUTTERWAVE';
export interface AuthorizeHoldParams {
    amount: number;
    currency: string;
    customerEmail: string;
    customerName?: string;
    paymentMethodToken?: string;
    metadata?: Record<string, any>;
}
export interface GatewayHoldResult {
    success: boolean;
    authorizationId: string;
    status: 'HELD' | 'FAILED';
    expiresAt?: Date;
    rawResponse?: any;
    failureReason?: string;
}
export interface CaptureHoldParams {
    authorizationId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
}
export interface GatewayCaptureResult {
    success: boolean;
    transactionReference: string;
    status: 'CAPTURED' | 'FAILED';
    capturedAt?: Date;
    rawResponse?: any;
    failureReason?: string;
}
export interface ReleaseHoldParams {
    authorizationId: string;
    reason?: string;
}
export interface GatewayReleaseResult {
    success: boolean;
    status: 'RELEASED' | 'FAILED';
    releasedAt?: Date;
    rawResponse?: any;
    failureReason?: string;
}
export interface InitializePaymentParams {
    amount: number;
    currency: string;
    customerEmail: string;
    customerName?: string;
    callbackUrl?: string;
    paymentChannels?: string[];
    metadata?: Record<string, any>;
}
export interface GatewayPaymentResult {
    success: boolean;
    transactionReference: string;
    paymentUrl?: string;
    virtualAccount?: {
        bankName: string;
        accountNumber: string;
        accountName: string;
    };
    rawResponse?: any;
}
export interface VerifyPaymentParams {
    transactionReference: string;
}
export interface GatewayVerifyResult {
    success: boolean;
    amount: number;
    currency: string;
    status: 'SUCCESSFUL' | 'FAILED';
    paymentMethod?: string;
    rawResponse?: any;
}
export interface WebhookEventResult {
    event: string;
    reference: string;
    amount?: number;
    status: 'SUCCESSFUL' | 'FAILED' | 'IGNORED';
    metadata?: Record<string, any>;
    rawEvent?: any;
}
export interface PaymentGatewayAdapter {
    readonly gatewayName: GatewayType;
    authorizeHold(params: AuthorizeHoldParams): Promise<GatewayHoldResult>;
    captureHold(params: CaptureHoldParams): Promise<GatewayCaptureResult>;
    releaseHold(params: ReleaseHoldParams): Promise<GatewayReleaseResult>;
    initializePayment(params: InitializePaymentParams): Promise<GatewayPaymentResult>;
    verifyPayment(params: VerifyPaymentParams): Promise<GatewayVerifyResult>;
    handleWebhook(payload: any, signature?: string): Promise<WebhookEventResult>;
}
