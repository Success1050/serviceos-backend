"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../core/prisma/prisma.module");
const notification_module_1 = require("../notification/notification.module");
const payment_service_1 = require("./payment.service");
const payment_controller_1 = require("./payment.controller");
const payment_gateway_factory_1 = require("./adapters/payment-gateway.factory");
const stripe_adapter_1 = require("./adapters/stripe.adapter");
const paystack_adapter_1 = require("./adapters/paystack.adapter");
const flutterwave_adapter_1 = require("./adapters/flutterwave.adapter");
const escrow_hold_cron_1 = require("./cron/escrow-hold.cron");
let PaymentModule = class PaymentModule {
};
exports.PaymentModule = PaymentModule;
exports.PaymentModule = PaymentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            notification_module_1.NotificationModule,
        ],
        controllers: [payment_controller_1.PaymentController],
        providers: [
            payment_service_1.PaymentService,
            payment_gateway_factory_1.PaymentGatewayFactory,
            stripe_adapter_1.StripeAdapter,
            paystack_adapter_1.PaystackAdapter,
            flutterwave_adapter_1.FlutterwaveAdapter,
            escrow_hold_cron_1.EscrowHoldCronService,
        ],
        exports: [
            payment_service_1.PaymentService,
            payment_gateway_factory_1.PaymentGatewayFactory,
        ],
    })
], PaymentModule);
//# sourceMappingURL=payment.module.js.map