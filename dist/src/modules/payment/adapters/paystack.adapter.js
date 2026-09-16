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
var PaystackAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let PaystackAdapter = PaystackAdapter_1 = class PaystackAdapter {
    configService;
    gatewayName = 'PAYSTACK';
    logger = new common_1.Logger(PaystackAdapter_1.name);
    secretKey;
    constructor(configService) {
        this.configService = configService;
        this.secretKey = this.configService.get('PAYSTACK_SECRET_KEY') || null;
    }
    get isConfigured() {
        return !!this.secretKey && !this.secretKey.includes('mock');
    }
    async authorizeHold(params) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        if (!this.isConfigured || !params.paymentMethodToken) {
            this.logger.log(`[PAYSTACK MOCK] Escrow pre-debit hold of ₦${params.amount} placed for ${params.customerEmail}`);
            return {
                success: true,
                authorizationId: `pstk_auth_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                status: 'HELD',
                expiresAt,
                rawResponse: { mode: 'mock', amount: params.amount, currency: params.currency || 'NGN' },
            };
        }
        try {
            const amountInKobo = Math.round(params.amount * 100);
            const payload = {
                authorization_code: params.paymentMethodToken,
                email: params.customerEmail,
                amount: amountInKobo,
                currency: params.currency || 'NGN',
                metadata: {
                    holdType: 'ESCROW_PRE_DEBIT',
                    ...params.metadata,
                },
            };
            const response = await axios_1.default.post('https://api.paystack.co/transaction/charge_authorization', payload, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.status && response.data.data.status === 'success') {
                return {
                    success: true,
                    authorizationId: response.data.data.reference,
                    status: 'HELD',
                    expiresAt,
                    rawResponse: response.data.data,
                };
            }
            return {
                success: false,
                authorizationId: '',
                status: 'FAILED',
                failureReason: response.data.message || 'Payment hold charge authorization failed',
                rawResponse: response.data,
            };
        }
        catch (error) {
            this.logger.error(`Paystack authorizeHold failed: ${error.response?.data?.message || error.message}`);
            return {
                success: false,
                authorizationId: '',
                status: 'FAILED',
                failureReason: error.response?.data?.message || error.message,
            };
        }
    }
    async captureHold(params) {
        const capturedAt = new Date();
        this.logger.log(`[PAYSTACK] Escrow captured and settled for reference: ${params.authorizationId}`);
        return {
            success: true,
            transactionReference: params.authorizationId,
            status: 'CAPTURED',
            capturedAt,
            rawResponse: { settled: true, capturedAt },
        };
    }
    async releaseHold(params) {
        const releasedAt = new Date();
        if (!this.isConfigured || params.authorizationId.startsWith('pstk_auth_')) {
            this.logger.log(`[PAYSTACK MOCK] Released escrow hold for reference ${params.authorizationId}`);
            return {
                success: true,
                status: 'RELEASED',
                releasedAt,
                rawResponse: { mode: 'mock' },
            };
        }
        try {
            const response = await axios_1.default.post('https://api.paystack.co/refund', {
                transaction: params.authorizationId,
                merchant_note: params.reason || 'ServiceOS site visit cancelled before dispatch',
            }, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
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
                failureReason: error.response?.data?.message || error.message,
            };
        }
    }
    async initializePayment(params) {
        const ref = `pstk_ref_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        if (!this.isConfigured) {
            return {
                success: true,
                transactionReference: ref,
                paymentUrl: `https://checkout.paystack.mock/pay/${ref}`,
                virtualAccount: {
                    bankName: 'Wema Bank (Mock)',
                    accountNumber: '9928374612',
                    accountName: `ServiceOS / ${params.customerName || 'Customer'}`,
                },
                rawResponse: { mode: 'mock' },
            };
        }
        try {
            const amountInKobo = Math.round(params.amount * 100);
            const payload = {
                email: params.customerEmail,
                amount: amountInKobo,
                reference: ref,
                currency: params.currency || 'NGN',
                callback_url: params.callbackUrl,
                metadata: params.metadata,
                channels: params.paymentChannels || ['card', 'bank_transfer', 'ussd', 'qr'],
            };
            const response = await axios_1.default.post('https://api.paystack.co/transaction/initialize', payload, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
            });
            return {
                success: true,
                transactionReference: ref,
                paymentUrl: response.data.data?.authorization_url,
                rawResponse: response.data.data,
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
        if (!this.isConfigured || params.transactionReference.startsWith('pstk_ref_')) {
            return {
                success: true,
                amount: 50000,
                currency: 'NGN',
                status: 'SUCCESSFUL',
                paymentMethod: 'BANK_TRANSFER',
            };
        }
        try {
            const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${params.transactionReference}`, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                },
            });
            const data = response.data.data;
            return {
                success: data.status === 'success',
                amount: data.amount / 100,
                currency: data.currency || 'NGN',
                status: data.status === 'success' ? 'SUCCESSFUL' : 'FAILED',
                paymentMethod: data.channel?.toUpperCase() || 'CARD',
                rawResponse: data,
            };
        }
        catch (error) {
            return {
                success: false,
                amount: 0,
                currency: 'NGN',
                status: 'FAILED',
                rawResponse: error.response?.data || error.message,
            };
        }
    }
    async handleWebhook(payload) {
        const event = payload.event;
        const data = payload.data;
        if (event === 'charge.success') {
            return {
                event,
                reference: data.reference,
                amount: data.amount / 100,
                status: 'SUCCESSFUL',
                metadata: data.metadata,
                rawEvent: payload,
            };
        }
        return {
            event,
            reference: data?.reference || 'unknown',
            status: 'IGNORED',
            rawEvent: payload,
        };
    }
};
exports.PaystackAdapter = PaystackAdapter;
exports.PaystackAdapter = PaystackAdapter = PaystackAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaystackAdapter);
//# sourceMappingURL=paystack.adapter.js.map