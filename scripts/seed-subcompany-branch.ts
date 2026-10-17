import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking Sunshine Solar HQ and provisioning attached sub-company...');

  const hq = await prisma.tenant.findUnique({
    where: { slug: 'sunshine-solar' },
    include: {
      settings: true,
      children: {
        include: {
          users: { select: { email: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!hq) {
    console.error('HQ tenant sunshine-solar not found!');
    process.exit(1);
  }

  console.log(`Found HQ: ${hq.name} (${hq.id})`);
  console.log(`Current existing children count: ${hq.children.length}`);

  const testPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(testPassword, 10);

  // 1. Ensure Sunshine Solar (Abuja Regional Branch) exists attached to HQ
  const branchSlug = 'sunshine-solar-abuja';
  const branchName = 'Sunshine Solar (Abuja Regional Branch)';

  const subcompany = await prisma.tenant.upsert({
    where: { slug: branchSlug },
    update: {
      name: branchName,
      parentId: hq.id,
      settings: {
        upsert: {
          create: {
            businessProfile: {
              companyName: branchName,
              industry: 'Solar & Renewable Energy',
              entityType: 'SUB_COMPANY',
              phone: '+234 802 334 5566',
              address: 'Plot 502 Central Business District',
              city: 'Abuja',
              state: 'FCT',
              country: 'Nigeria',
              currency: 'NGN',
              taxRate: 7.5,
              timezone: 'Africa/Lagos',
            },
            branding: {}, // Inherits HQ branding (#006937 Emerald)
            portal: {
              enabled: true,
              welcomeMessage: 'Welcome to Sunshine Solar Abuja Regional Branch. Certified installation & maintenance care.',
              allowQuotes: true,
              allowInvoices: true,
              allowPayments: true,
              allowServiceRequests: true,
              allowWarranties: true,
              supportEmail: 'abuja.dispatch@sunshinesolar.ng',
              supportPhone: '+234 802 334 5566',
            },
          },
          update: {
            businessProfile: {
              companyName: branchName,
              industry: 'Solar & Renewable Energy',
              entityType: 'SUB_COMPANY',
              phone: '+234 802 334 5566',
              address: 'Plot 502 Central Business District',
              city: 'Abuja',
              state: 'FCT',
              country: 'Nigeria',
              currency: 'NGN',
              taxRate: 7.5,
              timezone: 'Africa/Lagos',
            },
            portal: {
              enabled: true,
              welcomeMessage: 'Welcome to Sunshine Solar Abuja Regional Branch. Certified installation & maintenance care.',
              allowQuotes: true,
              allowInvoices: true,
              allowPayments: true,
              allowServiceRequests: true,
              allowWarranties: true,
              supportEmail: 'abuja.dispatch@sunshinesolar.ng',
              supportPhone: '+234 802 334 5566',
            },
          },
        },
      },
    },
    create: {
      name: branchName,
      slug: branchSlug,
      parentId: hq.id,
      settings: {
        create: {
          businessProfile: {
            companyName: branchName,
            industry: 'Solar & Renewable Energy',
            entityType: 'SUB_COMPANY',
            phone: '+234 802 334 5566',
            address: 'Plot 502 Central Business District',
            city: 'Abuja',
            state: 'FCT',
            country: 'Nigeria',
            currency: 'NGN',
            taxRate: 7.5,
            timezone: 'Africa/Lagos',
          },
          branding: {},
          portal: {
            enabled: true,
            welcomeMessage: 'Welcome to Sunshine Solar Abuja Regional Branch. Certified installation & maintenance care.',
            allowQuotes: true,
            allowInvoices: true,
            allowPayments: true,
            allowServiceRequests: true,
            allowWarranties: true,
            supportEmail: 'abuja.dispatch@sunshinesolar.ng',
            supportPhone: '+234 802 334 5566',
          },
        },
      },
    },
    include: { settings: true },
  });

  // 2. Ensure TENANT_OWNER role exists for this branch
  let branchOwnerRole = await prisma.role.findFirst({
    where: { name: 'TENANT_OWNER', tenantId: subcompany.id },
  });
  if (!branchOwnerRole) {
    branchOwnerRole = await prisma.role.create({
      data: {
        name: 'TENANT_OWNER',
        permissions: ['*'],
        tenantId: subcompany.id,
      },
    });
  }

  // 3. Create or update Branch Manager user
  const managerEmail = 'branch.abuja@sunshinesolar.com';
  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {
      passwordHash,
      tenantId: subcompany.id,
      roleId: branchOwnerRole.id,
      status: 'ACTIVE',
      requiresPasswordReset: false,
    },
    create: {
      email: managerEmail,
      firstName: 'Amina',
      lastName: 'Yusuf',
      passwordHash,
      tenantId: subcompany.id,
      roleId: branchOwnerRole.id,
      status: 'ACTIVE',
      requiresPasswordReset: false,
    },
  });

  console.log(`✓ Created/Updated Sub-company: ${subcompany.name} (${subcompany.slug})`);
  console.log(`✓ Attached Parent HQ ID: ${subcompany.parentId} (Sunshine Solar Ltd)`);
  console.log(`✓ Branch Manager User: ${manager.email}`);
  console.log(`✓ Password: ${testPassword}`);

  // 4. Also reset existing child's manager password so it is known
  const existingChild = hq.children[0];
  if (existingChild && existingChild.users[0]) {
    await prisma.user.update({
      where: { email: existingChild.users[0].email },
      data: {
        passwordHash,
        requiresPasswordReset: false,
      },
    });
    console.log(`✓ Also reset password for existing sub-company user: ${existingChild.users[0].email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
