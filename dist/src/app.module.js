"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const schedule_1 = require("@nestjs/schedule");
const bull_1 = require("@nestjs/bull");
const prisma_module_1 = require("./core/prisma/prisma.module");
const tenant_module_1 = require("./modules/tenant/tenant.module");
const customer_module_1 = require("./modules/customer/customer.module");
const auth_module_1 = require("./modules/auth/auth.module");
const quote_module_1 = require("./modules/quote/quote.module");
const portal_module_1 = require("./modules/portal/portal.module");
const job_module_1 = require("./modules/job/job.module");
const invoice_module_1 = require("./modules/invoice/invoice.module");
const asset_module_1 = require("./modules/asset/asset.module");
const import_module_1 = require("./modules/import/import.module");
const service_request_module_1 = require("./modules/service-request/service-request.module");
const maintenance_module_1 = require("./modules/maintenance/maintenance.module");
const notification_module_1 = require("./modules/notification/notification.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const jwt_guard_1 = require("./core/auth/jwt.guard");
const roles_guard_1 = require("./core/auth/roles.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            bull_1.BullModule.forRoot({
                redis: {
                    host: 'localhost',
                    port: 6379,
                },
            }),
            prisma_module_1.PrismaModule,
            tenant_module_1.TenantModule,
            customer_module_1.CustomerModule,
            auth_module_1.AuthModule,
            quote_module_1.QuoteModule,
            portal_module_1.PortalModule,
            job_module_1.JobModule,
            invoice_module_1.InvoiceModule,
            asset_module_1.AssetModule,
            import_module_1.ImportModule,
            service_request_module_1.ServiceRequestModule,
            maintenance_module_1.MaintenanceModule,
            notification_module_1.NotificationModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_guard_1.JwtGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map