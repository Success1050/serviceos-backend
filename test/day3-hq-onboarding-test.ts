import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/auth.service';
import { TenantService } from '../src/modules/tenant/tenant.service';
import { PrismaService } from '../src/core/prisma/prisma.service';

async function verifyHqOnboarding() {
  console.log('--- Verifying Franchise HQ vs Single Location Onboarding ---');
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const tenantService = app.get(TenantService);
  const prisma = app.get(PrismaService);

  const timestamp = Date.now();

  try {
    // 1. Register a Franchise HQ Company
    const hqEmail = `hq_founder_${timestamp}@example.com`;
    const hqPassword = 'Password123!';

    const registeredUser = await authService.register({
      firstName: 'Alhaji',
      lastName: 'Dantata',
      email: hqEmail,
      password: hqPassword,
    });

    const hqTenant = await tenantService.createTenant(
      {
        name: `SolarCorp Multi-Branch HQ ${timestamp}`,
        slug: `solarcorp-hq-${timestamp}`,
        industry: 'Solar & Energy',
        isHq: true,
        initialBranchName: 'Kano Regional Branch',
      },
      registeredUser.id
    );

    console.log(`✓ Created Corporate HQ Tenant: ${hqTenant.name} (${hqTenant.id})`);

    // Check user role
    const updatedUser = await prisma.user.findUnique({
      where: { id: registeredUser.id },
      include: { role: true, tenant: { include: { children: true } } },
    });

    console.log(`✓ HQ User Role: ${updatedUser?.role?.name} (Expected: HQ_ADMIN)`);
    console.log(`✓ Auto-provisioned Child Branches: ${updatedUser?.tenant?.children?.length} (Expected: 1)`);

    if (updatedUser?.role?.name !== 'HQ_ADMIN') {
      throw new Error(`Expected role 'HQ_ADMIN', got '${updatedUser?.role?.name}'`);
    }
    if ((updatedUser?.tenant?.children?.length ?? 0) !== 1) {
      throw new Error(`Expected 1 child branch, got ${updatedUser?.tenant?.children?.length}`);
    }

    console.log('\n--- ALL HQ ONBOARDING CHECKS PASSED SUCCESSFULLY! ---');
  } finally {
    await app.close();
  }
}

verifyHqOnboarding()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
