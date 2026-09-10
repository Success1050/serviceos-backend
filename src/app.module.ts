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

import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { SettingsModule } from './modules/settings/settings.module';
import { MailModule } from './core/mail/mail.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtGuard } from './core/auth/jwt.guard';
import { PermissionsGuard } from './core/auth/permissions.guard';

import { UserModule } from './modules/user/user.module';
import { DepartmentModule } from './modules/department/department.module';
import { AnnouncementModule } from './modules/announcement/announcement.module';
import { InternalTicketModule } from './modules/internal-ticket/internal-ticket.module';
import { RoleModule } from './modules/role/role.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    PrismaModule,
    AuthModule,
    MailModule,
    TenantModule,
    CustomerModule,
    QuoteModule,
    PortalModule,
    JobModule,
    InvoiceModule,
    AssetModule,
    ImportModule,
    ServiceRequestModule,
    MaintenanceModule,
    NotificationModule,
    AuditLogModule,
    SettingsModule,
    DepartmentModule,
    AnnouncementModule,
    InternalTicketModule,
    RoleModule,
    UserModule,
    AnalyticsModule,
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
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
