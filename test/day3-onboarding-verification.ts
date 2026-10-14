import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../src/modules/auth/auth.service';
import { TenantService } from '../src/modules/tenant/tenant.service';

const prisma = new PrismaClient();
const configService = new ConfigService();

async function runDay3OnboardingVerification() {
  console.log('========================================================================');
  console.log('🚀 DAY 3 INTEGRATION: TENANT ONBOARDING WIZARD & CREATION VERIFICATION');
  console.log('========================================================================\n');

  const authService = new AuthService(prisma as any, configService);
  const mockMailService = { sendStaffTemporaryPassword: async () => {} } as any;
  const tenantService = new TenantService(prisma as any, mockMailService);
  const timestamp = Date.now();

  try {
    // -------------------------------------------------------------------------
    // STEP 1: VERIFY SLUG AVAILABILITY ENGINE
    // -------------------------------------------------------------------------
    console.log('--- STEP 1: Verifying Slug Availability Engine ---');
    const existingCheck = await tenantService.checkSlugAvailability('sunshine-solar');
    console.log(`✓ Checked existing slug 'sunshine-solar': available = ${existingCheck.available}`);
    if (existingCheck.available !== false) {
      throw new Error("Expected 'sunshine-solar' to be unavailable, but returned available");
    }

    const testSlug = `ecopower-solutions-${timestamp}`;
    const newCheck = await tenantService.checkSlugAvailability(testSlug);
    console.log(`✓ Checked unique slug '${testSlug}': available = ${newCheck.available}`);
    if (newCheck.available !== true) {
      throw new Error(`Expected '${testSlug}' to be available, but returned unavailable`);
    }

    // -------------------------------------------------------------------------
    // STEP 2: USER REGISTRATION (STEP 1 OF WIZARD)
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 2: Executing Wizard User Registration (POST /auth/register) ---');
    const userEmail = `founder-${timestamp}@ecopower.ng`;
    const userPassword = 'EnterprisePassword123!';

    const registeredUser = await authService.register({
      firstName: 'Chidinma',
      lastName: 'Adeleke',
      email: userEmail,
      password: userPassword,
    });
    console.log(`✓ User registered: ${registeredUser.email} (ID: ${registeredUser.id})`);

    // -------------------------------------------------------------------------
    // STEP 3: SESSION AUTHENTICATION (POST /auth/login)
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 3: Authenticating Newly Registered User (POST /auth/login) ---');
    const loginResult = await authService.login({
      email: userEmail,
      password: userPassword,
    });
    console.log(`✓ Authenticated bearer token obtained: ${loginResult.accessToken.substring(0, 30)}...`);

    // -------------------------------------------------------------------------
    // STEP 4: TENANT PROVISIONING (POST /tenants - STEP 2, 3, 4 OF WIZARD)
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 4: Provisioning Organization Workspace (POST /tenants) ---');
    const tenantPayload = {
      name: `EcoPower Solutions Ltd ${timestamp}`,
      slug: testSlug,
      industry: 'Solar & Energy',
      phone: '+2348033221100',
      address: 'Lekki Phase 1, Lagos',
      currency: 'NGN',
      taxRate: 7.5,
      timezone: 'Africa/Lagos',
    };

    const provisionedTenant = await tenantService.createTenant(tenantPayload, registeredUser.id);
    console.log(`✓ Tenant Provisioned: ${provisionedTenant.name}`);
    console.log(`✓ Subdomain Slug: ${provisionedTenant.slug}`);
    console.log(`✓ Initialized Settings Profile:`, provisionedTenant.settings?.businessProfile);

    // -------------------------------------------------------------------------
    // STEP 5: VERIFY ROLE & PERMISSION ALLOCATION
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 5: Verifying Owner Role & Organization Linking ---');
    const updatedUser = await prisma.user.findUnique({
      where: { id: registeredUser.id },
      include: { role: true, tenant: true },
    });

    if (updatedUser?.tenantId !== provisionedTenant.id) {
      throw new Error('User tenantId does not match provisioned tenant ID');
    }
    if (updatedUser?.role?.name !== 'TENANT_OWNER') {
      throw new Error(`Expected role 'TENANT_OWNER', got '${updatedUser?.role?.name}'`);
    }
    console.log(`✓ User successfully upgraded to: ${updatedUser.role.name}`);
    console.log(`✓ Linked to Tenant: ${updatedUser.tenant?.name}`);

    // -------------------------------------------------------------------------
    // STEP 6: VERIFY SESSION REHYDRATION (GET /auth/me)
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 6: Verifying Full Session Rehydration (GET /auth/me) ---');
    const hydratedSession = await authService.getMe({ id: registeredUser.id });
    if (!hydratedSession.tenant || hydratedSession.tenant.id !== provisionedTenant.id) {
      throw new Error('GET /auth/me failed to hydrate the newly provisioned tenant');
    }
    console.log(`✓ Session rehydrated with active tenant: ${hydratedSession.tenant.name}`);

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- CLEANUP ---');
    await prisma.user.delete({ where: { id: registeredUser.id } });
    await prisma.role.deleteMany({ where: { tenantId: provisionedTenant.id } });
    await prisma.tenantSettings.deleteMany({ where: { tenantId: provisionedTenant.id } });
    await prisma.tenant.delete({ where: { id: provisionedTenant.id } });
    console.log('✓ Temporary onboarding test artifacts cleaned up.');

    console.log('\n========================================================================');
    console.log('🎉 DAY 3 INTEGRATION FULLY VERIFIED AND COMPLETE!');
    console.log('========================================================================');
  } catch (error) {
    console.error('\n❌ DAY 3 ONBOARDING VERIFICATION FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runDay3OnboardingVerification();
