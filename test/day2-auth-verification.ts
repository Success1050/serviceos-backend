import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../src/modules/auth/auth.service';
import * as bcrypt from 'bcrypt';
import { jwtVerify } from 'jose';

const prisma = new PrismaClient();
const configService = new ConfigService();

async function runDay2AuthVerification() {
  console.log('========================================================================');
  console.log('🚀 DAY 2 INTEGRATION: AUTHENTICATION ENGINE & SESSION CONTEXT VERIFICATION');
  console.log('========================================================================\n');

  const authService = new AuthService(prisma as any, configService);
  const timestamp = Date.now();
  const secretKey = new TextEncoder().encode(
    configService.get<string>('JWT_SECRET') || 'super-secret-key-for-dev-only-do-not-use-in-prod',
  );

  try {
    // -------------------------------------------------------------------------
    // STEP 1: PROVISION TEST TENANT & USER FOR DAY 2
    // -------------------------------------------------------------------------
    console.log('--- STEP 1: Provisioning Test Tenant and User ---');
    const tenant = await prisma.tenant.create({
      data: {
        name: `Solar Nexus Ltd ${timestamp}`,
        slug: `solar-nexus-${timestamp}`,
        settings: {
          create: {
            businessProfile: { companyName: 'Solar Nexus Ltd', currency: 'NGN' },
            branding: { primaryColor: '#006937' },
          },
        },
      },
      include: { settings: true },
    });
    console.log(`✓ Created Tenant: ${tenant.name} (${tenant.id})`);

    // Create Role
    const ownerRole = await prisma.role.create({
      data: {
        name: 'TENANT_OWNER',
        permissions: ['manage_users', 'manage_billing', 'manage_dispatch'],
        tenantId: tenant.id,
      },
    });

    const plainPassword = 'SecurePassword123!';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const testUser = await prisma.user.create({
      data: {
        email: `owner-${timestamp}@solarnexus.ng`,
        firstName: 'Emeka',
        lastName: 'Okonkwo',
        passwordHash,
        tenantId: tenant.id,
        roleId: ownerRole.id,
        directPermissions: ['special_override_perm'],
      },
      include: { role: true, tenant: true },
    });
    console.log(`✓ Created User: ${testUser.email} (Role: ${ownerRole.name})`);

    // -------------------------------------------------------------------------
    // STEP 2: VERIFY POST /auth/login RETURN PAYLOAD
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 2: Verifying POST /auth/login Integration ---');
    const loginResult = await authService.login({
      email: testUser.email,
      password: plainPassword,
    });

    if (!loginResult.accessToken) {
      throw new Error('Login failed to return accessToken');
    }
    if (!loginResult.user || loginResult.user.email !== testUser.email) {
      throw new Error('Login failed to return valid user profile');
    }
    if (loginResult.user.role !== 'TENANT_OWNER') {
      throw new Error(`Expected role 'TENANT_OWNER', got '${loginResult.user.role}'`);
    }
    if (!loginResult.tenant || loginResult.tenant.id !== tenant.id) {
      throw new Error('Login failed to return attached tenant');
    }

    console.log(`✓ Access Token issued: ${loginResult.accessToken.substring(0, 32)}...`);
    console.log(`✓ User Role normalized: ${loginResult.user.role}`);
    console.log(`✓ User Permissions: [${loginResult.user.permissions.join(', ')}]`);
    console.log(`✓ Tenant hydrated: ${loginResult.tenant.name} (${loginResult.tenant.slug})`);

    // -------------------------------------------------------------------------
    // STEP 3: VERIFY JWT PAYLOAD INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 3: Verifying Cryptographic JWT Payload ---');
    const { payload } = await jwtVerify(loginResult.accessToken, secretKey);
    console.log(`✓ JWT sub (User ID): ${payload.sub}`);
    console.log(`✓ JWT tenantId: ${payload.tenantId}`);
    console.log(`✓ JWT role: ${payload.role}`);
    console.log(`✓ JWT isSuperAdmin: ${payload.isSuperAdmin}`);

    if (payload.sub !== testUser.id || payload.tenantId !== tenant.id) {
      throw new Error('JWT payload claims mismatch');
    }

    // -------------------------------------------------------------------------
    // STEP 4: VERIFY GET /auth/me SESSION HYDRATION
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 4: Verifying GET /auth/me Session Hydration ---');
    const meResult = await authService.getMe({ id: testUser.id });

    if (!meResult.user || meResult.user.email !== testUser.email) {
      throw new Error('GET /auth/me failed to return user profile');
    }
    if (!meResult.tenant || meResult.tenant.id !== tenant.id) {
      throw new Error('GET /auth/me failed to return active tenant context');
    }

    console.log(`✓ Session successfully rehydrated for: ${meResult.user.email}`);
    console.log(`✓ Tenant settings preserved: ${JSON.stringify(meResult.tenant.settings?.businessProfile)}`);

    // -------------------------------------------------------------------------
    // STEP 5: VERIFY INVALID CREDENTIALS REJECTION
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 5: Verifying Invalid Credentials Guard ---');
    let rejected = false;
    try {
      await authService.login({
        email: testUser.email,
        password: 'WrongPassword!',
      });
    } catch (err: any) {
      rejected = true;
      console.log(`✓ Correctly rejected invalid password with: ${err.message}`);
    }
    if (!rejected) {
      throw new Error('AuthService accepted invalid password');
    }

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- CLEANUP ---');
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.role.delete({ where: { id: ownerRole.id } });
    await prisma.tenantSettings.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
    console.log('✓ Temporary test artifacts cleaned up.');

    console.log('\n========================================================================');
    console.log('🎉 DAY 2 INTEGRATION FULLY VERIFIED AND COMPLETE!');
    console.log('========================================================================');
  } catch (error) {
    console.error('\n❌ DAY 2 INTEGRATION VERIFICATION FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runDay2AuthVerification();
