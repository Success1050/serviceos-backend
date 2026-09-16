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
var FlutterwaveAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlutterwaveAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let FlutterwaveAdapter = FlutterwaveAdapter_1 = class FlutterwaveAdapter {
    configService;
    gatewayName = 'FLUTTERWAVE';
    logger = new common_1.Logger(FlutterwaveAdapter_1.name);
    secretKey;
    constructor(configService) {
        this.configService = configService;
        this.secretKey = this.configService.get('FLUTTERWAVE_SECRET_KEY') || null;
    }
    get isConfigured() {
        return !!this.secretKey && !this.secretKey.includes('mock');
    }
    async authorizeHold(params) {
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
            const response = await axios_1.default.post('https://api.flutterwave.com/v3/charges?type=card', {
                token: params.paymentMethodToken,
                currency: params.currency || 'USD',
                amount: params.amount,
                email: params.customerEmail,
                tx_ref: `flw_preauth_${Date.now()}`,
                auth_model: 'AUTH',
            }, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
            });
            return {
                success: response.data.status === 'success',
                authorizationId: response.data.data?.flw_ref || response.data.data?.id?.toString(),
                status: 'HELD',
                expiresAt,
                rawResponse: response.data,
            };
        }
        catch (error) {
            this.logger.error(`Flutterwave authorizeHold failed: ${error.response?.data?.message || error.message}`);
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
            const response = await axios_1.default.post(`https://api.flutterwave.com/v3/charges/${params.authorizationId}/capture`, { amount: params.amount }, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
            });
            return {
                success: response.data.status === 'success',
                transactionReference: response.data.data?.id?.toString() || params.authorizationId,
                status: 'CAPTURED',
                capturedAt,
                rawResponse: response.data,
            };
        }
        catch (error) {
            return {
                success: false,
                transactionReference: params.authorizationId,
                status: 'FAILED',
                failureReason: error.response?.data?.message || error.message,
            };
        }
    }
    async releaseHold(params) {
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
            const response = await axios_1.default.post(`https://api.flutterwave.com/v3/charges/${params.authorizationId}/void`, {}, {
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
            const response = await axios_1.default.post('https://api.flutterwave.com/v3/payments', {
                tx_ref: ref,
                amount: params.amount,
                currency: params.currency || 'USD',
                redirect_url: params.callbackUrl,
                customer: {
                    email: params.customerEmail,
                    name: params.customerName || 'ServiceOS Client',
                },
                meta: params.metadata,
            }, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
            });
            return {
                success: response.data.status === 'success',
                transactionReference: ref,
                paymentUrl: response.data.data?.link,
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
        if (!this.isConfigured || params.transactionReference.startsWith('flw_ref_')) {
            return {
                success: true,
                amount: 100,
                currency: 'USD',
                status: 'SUCCESSFUL',
            };
        }
        try {
            const response = await axios_1.default.get(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${params.transactionReference}`, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                },
            });
            const data = response.data.data;
            return {
                success: data.status === 'successful',
                amount: data.amount,
                currency: data.currency,
                status: data.status === 'successful' ? 'SUCCESSFUL' : 'FAILED',
                paymentMethod: data.payment_type?.toUpperCase(),
                rawResponse: data,
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
};
exports.FlutterwaveAdapter = FlutterwaveAdapter;
exports.FlutterwaveAdapter = FlutterwaveAdapter = FlutterwaveAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FlutterwaveAdapter);
//# sourceMappingURL=flutterwave.adapter.js.map