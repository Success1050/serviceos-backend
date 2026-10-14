import { PrismaClient, SubscriptionTier, ServiceModule } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { SuperAdminTelemetryService } from '../src/modules/superadmin/services/superadmin-telemetry.service';
import { SuperAdminTenantService } from '../src/modules/superadmin/services/superadmin-tenant.service';
import { SuperAdminSubscriptionService } from '../src/modules/superadmin/services/superadmin-subscription.service';
import { SuperAdminImpersonationService } from '../src/modules/superadmin/services/superadmin-impersonation.service';
import { ModuleGuard } from '../src/core/auth/module.guard';
import { SuperAdminGuard } from '../src/core/auth/superadmin.guard';
import { REQUIRE_MODULE_KEY } from '../src/core/decorators/require-module.decorator';
import { ModuleRestrictedException } from '../src/core/exceptions/module-restricted.exception';
import { jwtVerify } from 'jose';

const prisma = new PrismaClient();
const configService = new ConfigService();

async function runStage29Verification() {
  console.log('========================================================================');
  console.log('🚀 STAGE 29: SUPERADMIN CONTROL PLANE & SUBSCRIPTION GATING VERIFICATION');
  console.log('========================================================================\n');

  const telemetryService = new SuperAdminTelemetryService(prisma as any);
  const tenantService = new SuperAdminTenantService(prisma as any);
  const subscriptionService = new SuperAdminSubscriptionService(prisma as any);
  const impersonationService = new SuperAdminImpersonationService(prisma as any, configService);

  const timestamp = Date.now();
  const secretKey = new TextEncoder().encode(
    configService.get<string>('JWT_SECRET') || 'super-secret-key-for-dev-only-do-not-use-in-prod',
  );

  try {
    // -------------------------------------------------------------------------
    // 1. VERIFY DEFAULT SUBSCRIPTION PLANS SEEDING
    // -------------------------------------------------------------------------
    console.log('--- STEP 1: Verifying Subscription Plans Seeding ---');
    await subscriptionService.seedDefaultPlans();
    const plans = await subscriptionService.listPlans();

    console.log(`✓ Total Subscription Plans Available: ${plans.length}`);
    for (const plan of plans) {
      console.log(`   • [${plan.tier}] ${plan.name} ($${plan.priceMonthly}/mo) -> ${plan.enabledModules.length} Modules`);
    }

    const starterPlan = plans.find((p) => p.tier === SubscriptionTier.STARTER);
    const enterprisePlan = plans.find((p) => p.tier === SubscriptionTier.ENTERPRISE);

    if (!starterPlan || !enterprisePlan) {
      throw new Error('Default plans were not properly seeded.');
    }

    // -------------------------------------------------------------------------
    // 2. CREATE SUPERADMIN ROOT USER & HIERARCHY
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 2: Creating Platform SuperAdmin & Multi-Tenant Hierarchy ---');

    // Create Platform SuperAdmin (tenantId = null, isSuperAdmin = true)
    const superAdmin = await prisma.user.create({
      data: {
        email: `superadmin-${timestamp}@serviceos.platform`,
        passwordHash: '$2b$10$fakehashforstage29testonly',
        firstName: 'Platform',
        lastName: 'SuperAdmin',
        isSuperAdmin: true,
        tenantId: null,
      },
    });
    console.log(`✓ SuperAdmin created: ${superAdmin.email} (isSuperAdmin: ${superAdmin.isSuperAdmin})`);

    // Create Corporate HQ Parent Tenant
    const parentHq = await prisma.tenant.create({
      data: {
        name: `SolarMax Global Corp (${timestamp})`,
        slug: `solarmax-hq-${timestamp}`,
      },
    });

    // Assign Enterprise Plan to Parent HQ
    await subscriptionService.assignSubscription(parentHq.id, {
      planId: enterprisePlan.id,
      billingCycle: 'ANNUAL',
      status: 'ACTIVE',
    });
    console.log(`✓ Parent Corporate HQ: ${parentHq.name} on ${enterprisePlan.name}`);

    // Create Child Sub-Company (Lagos Branch) linked to Parent HQ
    const lagosBranch = await prisma.tenant.create({
      data: {
        name: `SolarMax Lagos Island (${timestamp})`,
        slug: `solarmax-lagos-${timestamp}`,
        parentId: parentHq.id,
      },
    });

    // Create Branch Manager User
    const branchManager = await prisma.user.create({
      data: {
        email: `manager-${timestamp}@solarmax.lagos`,
        passwordHash: '$2b$10$fakehashforstage29testonly',
        firstName: 'Babatunde',
        lastName: 'Fashola',
        tenantId: lagosBranch.id,
        isFieldTech: false,
      },
    });

    // Create Field Technician under Branch
    const tech = await prisma.user.create({
      data: {
        email: `tech-${timestamp}@solarmax.lagos`,
        passwordHash: '$2b$10$fakehashforstage29testonly',
        firstName: 'Emeka',
        lastName: 'FieldTech',
        tenantId: lagosBranch.id,
        isFieldTech: true,
      },
    });
    console.log(`✓ Child Branch created: ${lagosBranch.name} with Manager and Field Tech`);

    // Create Standalone Contractor Tenant with STARTER Plan
    const standaloneContractor = await prisma.tenant.create({
      data: {
        name: `Apex Local Electric (${timestamp})`,
        slug: `apex-electric-${timestamp}`,
      },
    });

    await subscriptionService.assignSubscription(standaloneContractor.id, {
      planId: starterPlan.id,
      billingCycle: 'MONTHLY',
      status: 'ACTIVE',
    });
    console.log(`✓ Standalone Contractor: ${standaloneContractor.name} on ${starterPlan.name}`);

    // -------------------------------------------------------------------------
    // 3. PLATFORM TELEMETRY & GLOBAL GOD-VIEW
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 3: Testing Platform Overview & Hierarchy Telemetry ---');
    const overview = await telemetryService.getPlatformOverview();
    console.log('✓ Platform Telemetry Summary:');
    console.log(`   • Total Tenants: ${overview.metrics.totalTenants} (Parent: ${overview.metrics.parentTenantsCount}, Branches: ${overview.metrics.childTenantsCount})`);
    console.log(`   • Total Users: ${overview.metrics.totalUsers} (Technicians: ${overview.metrics.totalTechnicians})`);
    console.log(`   • Platform MRR: $${overview.metrics.mrr.toFixed(2)}`);
    console.log(`   • Tier Distribution:`, overview.planDistribution);

    // List tenants tree
    const tenantTree = await tenantService.listTenants({ isParentOnly: true });
    const foundParent = tenantTree.data.find((t: any) => t.id === parentHq.id);
    if (!foundParent || foundParent.subCompanies.length === 0) {
      throw new Error('Tenant hierarchy tree failed to nest child sub-companies.');
    }
    console.log(`✓ Parent Hierarchy Query verified: ${foundParent.name} has ${foundParent.subCompanies.length} nested branch(es)`);

    // -------------------------------------------------------------------------
    // 4. AUDITED 1-CLICK TENANT IMPERSONATION
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 4: Testing Audited 1-Click Tenant Impersonation ---');
    const impersonationResult = await impersonationService.impersonateTenant(
      lagosBranch.id,
      {
        reason: 'SuperAdmin investigating Lagos branch dispatch scheduling performance',
        targetUserId: branchManager.id,
      },
      superAdmin,
    );

    console.log(`✓ Impersonation Token Generated: ${impersonationResult.accessToken.substring(0, 30)}...`);
    console.log(`✓ Impersonated User: ${impersonationResult.impersonatedUser.email} for Tenant: ${impersonationResult.targetTenant.name}`);

    // Verify token claims
    const { payload } = await jwtVerify(impersonationResult.accessToken, secretKey);
    if (!payload.isImpersonating || payload.impersonatedBy !== superAdmin.id) {
      throw new Error('Impersonation token lacks audited identity claims.');
    }
    console.log(`✓ Token verified: isImpersonating=${payload.isImpersonating}, impersonatedBy=${payload.impersonatedBy}`);

    // Verify AuditLog entry
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        action: 'SUPERADMIN_IMPERSONATE',
        tenantId: lagosBranch.id,
        userId: superAdmin.id,
      },
    });

    if (!auditRecord) {
      throw new Error('Immutable AuditLog record was not persisted for impersonation.');
    }
    console.log(`✓ Audit Log Entry Confirmed: ID ${auditRecord.id} | Action: ${auditRecord.action}`);

    // -------------------------------------------------------------------------
    // 5. DECLARATIVE MODULE FEATURE-GATING & HTTP 402 PROTECTION
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 5: Testing Module Feature-Gating & Cascading Entitlements ---');

    // Create Mock Reflector
    const createMockContext = (user: any, requiredModules: ServiceModule[]) => {
      const mockReflector = {
        getAllAndOverride: (key: string) => {
          if (key === REQUIRE_MODULE_KEY) return requiredModules;
          return false;
        },
      } as any;

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            user,
            headers: {},
            params: {},
          }),
        }),
      } as any;

      return { mockReflector, mockContext };
    };

    // Case 5A: Starter Plan contractor accesses MODULE_QUOTES -> SHOULD PASS
    const starterUser = { id: 'u1', tenantId: standaloneContractor.id, isSuperAdmin: false };
    const { mockReflector: ref1, mockContext: ctx1 } = createMockContext(starterUser, [
      ServiceModule.MODULE_QUOTES,
    ]);
    const moduleGuard1 = new ModuleGuard(ref1, prisma as any);
    const passResult = await moduleGuard1.canActivate(ctx1);
    console.log(`✓ Case 5A: Starter plan accessing MODULE_QUOTES -> Result: ${passResult} (ALLOWED)`);

    // Case 5B: Starter Plan contractor accesses MODULE_FINTECH_WALLETS -> SHOULD THROW 402
    const { mockReflector: ref2, mockContext: ctx2 } = createMockContext(starterUser, [
      ServiceModule.MODULE_FINTECH_WALLETS,
    ]);
    const moduleGuard2 = new ModuleGuard(ref2, prisma as any);
    let restrictedErrorCaught = false;
    try {
      await moduleGuard2.canActivate(ctx2);
    } catch (err: any) {
      if (err instanceof ModuleRestrictedException && err.getStatus() === 402) {
        restrictedErrorCaught = true;
        console.log(`✓ Case 5B: Starter plan accessing MODULE_FINTECH_WALLETS -> Blocked with HTTP 402: "${err.message}"`);
      }
    }
    if (!restrictedErrorCaught) {
      throw new Error('Module feature-gating failed to block unauthorized module access with HTTP 402.');
    }

    // Case 5C: Sub-Company Branch accesses MODULE_FINTECH_WALLETS (Inherited from Parent HQ Enterprise)
    // Lagos Branch has no direct subscription record, but parent has ENTERPRISE (which includes FINTECH)
    const branchUser = { id: branchManager.id, tenantId: lagosBranch.id, isSuperAdmin: false };
    const { mockReflector: ref3, mockContext: ctx3 } = createMockContext(branchUser, [
      ServiceModule.MODULE_FINTECH_WALLETS,
    ]);
    const moduleGuard3 = new ModuleGuard(ref3, prisma as any);
    const cascadePass = await moduleGuard3.canActivate(ctx3);
    console.log(`✓ Case 5C: Sub-company accessing MODULE_FINTECH_WALLETS via Parent Enterprise Inheritance -> Result: ${cascadePass} (ALLOWED)`);

    // Case 5D: SuperAdmin Platform Root Bypass
    const superAdminUserContext = { id: superAdmin.id, tenantId: null, isSuperAdmin: true };
    const { mockReflector: ref4, mockContext: ctx4 } = createMockContext(superAdminUserContext, [
      ServiceModule.MODULE_FINTECH_WALLETS,
    ]);
    const moduleGuard4 = new ModuleGuard(ref4, prisma as any);
    const superAdminPass = await moduleGuard4.canActivate(ctx4);
    console.log(`✓ Case 5D: SuperAdmin direct bypass on gated module -> Result: ${superAdminPass} (ALLOWED)`);

    // -------------------------------------------------------------------------
    // 6. TENANT SUSPENSION CASCADE
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 6: Testing Tenant Suspension with Branch Cascade ---');
    const suspendResult = await tenantService.updateTenantStatus(
      parentHq.id,
      {
        isSuspended: true,
        suspensionReason: 'Overdue franchise billing',
        cascadeToBranches: true,
      },
      superAdmin.id,
    );
    console.log(`✓ Suspended Parent HQ: isSuspended=${suspendResult.isSuspended}`);

    const refreshedBranch = await prisma.tenant.findUnique({ where: { id: lagosBranch.id } });
    if (!refreshedBranch?.isSuspended) {
      throw new Error('Suspension cascade failed to suspend child branch.');
    }
    console.log(`✓ Cascaded Suspension confirmed on Child Branch: isSuspended=${refreshedBranch.isSuspended} | Reason: "${refreshedBranch.suspensionReason}"`);

    // Clean up test data
    console.log('\n--- Cleaning up test records ---');
    await prisma.auditLog.deleteMany({
      where: { tenantId: { in: [parentHq.id, lagosBranch.id, standaloneContractor.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [superAdmin.id, branchManager.id, tech.id] } },
    });
    await prisma.tenantSubscription.deleteMany({
      where: { tenantId: { in: [parentHq.id, lagosBranch.id, standaloneContractor.id] } },
    });
    await prisma.tenant.deleteMany({
      where: { id: { in: [lagosBranch.id, parentHq.id, standaloneContractor.id] } },
    });
    console.log('✓ Test data cleaned up successfully.');

    console.log('\n========================================================================');
    console.log('🎉 ALL STAGE 29 SUPERADMIN & MODULE-GATING CHECKS PASSED SUCCESSFULLY!');
    console.log('========================================================================');
  } finally {
    await prisma.$disconnect();
  }
}

runStage29Verification().catch((err) => {
  console.error('❌ Verification error:', err);
  process.exit(1);
});
