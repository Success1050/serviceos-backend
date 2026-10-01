import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SuperAdminController } from './superadmin.controller';
import { SuperAdminTelemetryService } from './services/superadmin-telemetry.service';
import { SuperAdminTenantService } from './services/superadmin-tenant.service';
import { SuperAdminSubscriptionService } from './services/superadmin-subscription.service';
import { SuperAdminImpersonationService } from './services/superadmin-impersonation.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [SuperAdminController],
  providers: [
    SuperAdminTelemetryService,
    SuperAdminTenantService,
    SuperAdminSubscriptionService,
    SuperAdminImpersonationService,
  ],
  exports: [
    SuperAdminTelemetryService,
    SuperAdminTenantService,
    SuperAdminSubscriptionService,
    SuperAdminImpersonationService,
  ],
})
export class SuperAdminModule {}
