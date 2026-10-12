import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedDemoUsers() {
  console.log('Seeding predictable demo users for manual testing...');
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Ensure Sunshine Solar Tenant Exists
  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'sunshine-solar' },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Sunshine Solar Ltd',
        slug: 'sunshine-solar',
        settings: {
          create: {
            businessProfile: {
              companyName: 'Sunshine Solar Ltd',
              currency: 'NGN',
              taxRate: 7.5,
              phone: '+2348000000000',
              address: 'Plot 14 Victoria Island, Lagos',
            },
            branding: {
              primaryColor: '#006937',
              secondaryColor: '#004D28',
            },
            portal: {
              allowQuotes: true,
              allowInvoices: true,
              allowPayments: true,
              allowServiceRequests: true,
            },
          },
        },
      },
    });
    console.log(`Created tenant: Sunshine Solar Ltd (${tenant.id})`);
  } else {
    console.log(`Found existing tenant: Sunshine Solar Ltd (${tenant.id})`);
  }

  // 2. Ensure Roles Exist
  let ownerRole = await prisma.role.findFirst({
    where: { name: 'TENANT_OWNER', tenantId: tenant.id },
  });
  if (!ownerRole) {
    ownerRole = await prisma.role.create({
      data: {
        name: 'TENANT_OWNER',
        permissions: ['*'],
        tenantId: tenant.id,
      },
    });
  }

  let managerRole = await prisma.role.findFirst({
    where: { name: 'MANAGER', tenantId: tenant.id },
  });
  if (!managerRole) {
    managerRole = await prisma.role.create({
      data: {
        name: 'MANAGER',
        permissions: ['manage_jobs', 'manage_customers', 'manage_quotes', 'manage_invoices'],
        tenantId: tenant.id,
      },
    });
  }

  let techRole = await prisma.role.findFirst({
    where: { name: 'TECHNICIAN', tenantId: tenant.id },
  });
  if (!techRole) {
    techRole = await prisma.role.create({
      data: {
        name: 'TECHNICIAN',
        permissions: ['view_assigned_jobs', 'update_job_status', 'complete_job'],
        tenantId: tenant.id,
      },
    });
  }

  let hqRole = await prisma.role.findFirst({
    where: { name: 'HQ_ADMIN', tenantId: tenant.id },
  });
  if (!hqRole) {
    hqRole = await prisma.role.create({
      data: {
        name: 'HQ_ADMIN',
        permissions: ['*'],
        tenantId: tenant.id,
      },
    });
  }

  // 3. Platform SuperAdmin (Platform Root, no tenantId)
  await prisma.user.upsert({
    where: { email: 'superadmin@serviceos.platform' },
    update: {
      passwordHash,
      isSuperAdmin: true,
      requiresPasswordReset: false,
    },
    create: {
      email: 'superadmin@serviceos.platform',
      firstName: 'Platform',
      lastName: 'SuperAdmin',
      passwordHash,
      isSuperAdmin: true,
      requiresPasswordReset: false,
    },
  });
  console.log('✓ Platform SuperAdmin: superadmin@serviceos.platform');

  // 4. Tenant Owner
  await prisma.user.upsert({
    where: { email: 'owner@sunshinesolar.com' },
    update: {
      passwordHash,
      tenantId: tenant.id,
      roleId: ownerRole.id,
      requiresPasswordReset: false,
    },
    create: {
      email: 'owner@sunshinesolar.com',
      firstName: 'Babajide',
      lastName: 'Solarin',
      passwordHash,
      tenantId: tenant.id,
      roleId: ownerRole.id,
      requiresPasswordReset: false,
    },
  });
  console.log('✓ Tenant Owner: owner@sunshinesolar.com');

  // 5. Operations Manager
  await prisma.user.upsert({
    where: { email: 'manager@sunshinesolar.com' },
    update: {
      passwordHash,
      tenantId: tenant.id,
      roleId: managerRole.id,
      requiresPasswordReset: false,
    },
    create: {
      email: 'manager@sunshinesolar.com',
      firstName: 'Amina',
      lastName: 'Yusuf',
      passwordHash,
      tenantId: tenant.id,
      roleId: managerRole.id,
      requiresPasswordReset: false,
    },
  });
  console.log('✓ Operations Manager: manager@sunshinesolar.com');

  // 6. Field Technician
  await prisma.user.upsert({
    where: { email: 'tech@sunshinesolar.com' },
    update: {
      passwordHash,
      tenantId: tenant.id,
      roleId: techRole.id,
      phone: '+2348012345678',
      isFieldTech: true,
      requiresPasswordReset: false,
    },
    create: {
      email: 'tech@sunshinesolar.com',
      firstName: 'Emeka',
      lastName: 'Eze',
      passwordHash,
      tenantId: tenant.id,
      roleId: techRole.id,
      phone: '+2348012345678',
      isFieldTech: true,
      requiresPasswordReset: false,
    },
  });
  console.log('✓ Field Technician: tech@sunshinesolar.com');

  // 7. Franchise HQ Executive
  await prisma.user.upsert({
    where: { email: 'hq@sunshinesolar.com' },
    update: {
      passwordHash,
      tenantId: tenant.id,
      roleId: hqRole.id,
      requiresPasswordReset: false,
    },
    create: {
      email: 'hq@sunshinesolar.com',
      firstName: 'Chief Adewale',
      lastName: 'Solarin',
      passwordHash,
      tenantId: tenant.id,
      roleId: hqRole.id,
      requiresPasswordReset: false,
    },
  });
  console.log('✓ Franchise HQ Executive: hq@sunshinesolar.com');

  console.log('\nAll demo accounts seeded successfully with password: Password123!');
}

seedDemoUsers()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
