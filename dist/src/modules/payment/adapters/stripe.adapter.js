"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StripeAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let StripeAdapter = StripeAdapter_1 = class StripeAdapter {
    configService;
    gatewayName = 'STRIPE';
    logger = new common_1.Logger(StripeAdapter_1.name);
    apiKey;
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('STRIPE_SECRET_KEY') || null;
    }
    get isConfigured() {
        return !!this.apiKey && !this.apiKey.includes('mock');
    }
    async authorizeHold(params) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
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
                capture_method: 'manual',
                'payment_method_types[]': 'card',
                description: `ServiceOS 24h Pre-arrival Hold for ${params.customerEmail}`,
            });
            if (params.paymentMethodToken) {
                postData.append('payment_method', params.paymentMethodToken);
                postData.append('confirm', 'true');
            }
            const response = await axios_1.default.post('https://api.stripe.com/v1/payment_intents', postData.toString(), {
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
        }
        catch (error) {
            this.logger.error(`Stripe authorizeHold failed: ${error.response?.data?.error?.message || error.message}`);
            return {
                success: false,
                authorizationId: '',
                status: 'FAILED',
                failureReason: error.response?.data?.error?.message || error.message,
            };
        }
    }
    async captureHold(params) {
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
            const response = await axios_1.default.post(`https://api.stripe.com/v1/payment_intents/${params.authorizationId}/capture`, postData.toString(), {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return {
                success: true,
                transactionReference: response.data.id,
                status: 'CAPTURED',
                capturedAt,
                rawResponse: response.data,
            };
        }
        catch (error) {
            this.logger.error(`Stripe captureHold failed: ${error.response?.data?.error?.message || error.message}`);
            return {
                success: false,
                transactionReference: params.authorizationId,
                status: 'FAILED',
                failureReason: error.response?.data?.error?.message || error.message,
            };
        }
    }
    async releaseHold(params) {
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
            const response = await axios_1.default.post(`https://api.stripe.com/v1/payment_intents/${params.authorizationId}/cancel`, {}, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return {
                success: true,
                status: 'RELEASED',
                releasedAt,
                rawResponse: response.data,
            };
        }
        catch (error) {
            return {
                success: false,
                status: 'FAILED',
                failureReason: error.response?.data?.error?.message || error.message,
            };
        }
    }
    async initializePayment(params) {
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
            const response = await axios_1.default.post('https://api.stripe.com/v1/checkout/sessions', postData.toString(), {
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
        }
        catch (error) {
            return {
                success: false,
                transactionReference: ref,
                rawResponse: error.response?.data || error.message,
            };
        }
    }
    async verifyPayment(params) {
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
            const response = await axios_1.default.get(`https://api.stripe.com/v1/payment_intents/${params.transactionReference}`, {
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
        }
        catch (error) {
            return {
                success: false,
                amount: 0,
                currency: 'USD',
                status: 'FAILED',
                rawResponse: error.response?.data || error.message,
            };
        }
    }
    async handleWebhook(payload) {
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
};
exports.StripeAdapter = StripeAdapter;
exports.StripeAdapter = StripeAdapter = StripeAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeAdapter);
//# sourceMappingURL=stripe.adapter.js.map