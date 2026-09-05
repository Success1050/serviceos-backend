import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './core/prisma/prisma.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { CustomerModule } from './modules/customer/customer.module';
import { AuthModule } from './modules/auth/auth.module';
import { QuoteModule } from './modules/quote/quote.module';
import { PortalModule } from './modules/portal/portal.module';
import { JobModule } from './modules/job/job.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { AssetModule } from './modules/asset/asset.module';
import { ImportModule } from './modules/import/import.module';
import { ServiceRequestModule } from './modules/service-request/service-request.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtGuard } from './core/auth/jwt.guard';
import { RolesGuard } from './core/auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    PrismaModule,
    TenantModule,
    CustomerModule,
    AuthModule,
    QuoteModule,
    PortalModule,
    JobModule,
    InvoiceModule,
    AssetModule,
    ImportModule,
    ServiceRequestModule,
    MaintenanceModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
