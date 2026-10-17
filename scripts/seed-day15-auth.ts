import { PrismaClient } from '@prisma/client';
import { TokenUtil } from '../src/core/shared/utils/token.util';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Day 15 Passwordless Customer Auth & Contextual Invites...');

  const sunshine = await prisma.tenant.findUnique({ where: { slug: 'sunshine-solar' } });
  const greenpower = await prisma.tenant.findUnique({ where: { slug: 'greenpower' } });

  if (!sunshine || !greenpower) {
    console.error('Missing sunshine-solar or greenpower tenants. Please run seed-day14-portal.ts first.');
    process.exit(1);
  }

  // 1. Seed Multi-Company Customer: "Chief John Okafor"
  const multiCustomerPhone = '+2348001112222';
  const multiCustomerEmail = 'john.okafor@example.com';
  const multiCustomerName = 'Chief John Okafor';

  // Identity in ServiceOS Global Directory
  const identity = await prisma.serviceOSIdentity.upsert({
    where: { phone: multiCustomerPhone },
    update: {
      email: multiCustomerEmail,
      status: 'ACTIVE',
    },
    create: {
      phone: multiCustomerPhone,
      email: multiCustomerEmail,
      status: 'ACTIVE',
    },
  });

  // Customer Record at Sunshine Solar
  let sunshineCustomer = await prisma.customerRecord.findFirst({
    where: { tenantId: sunshine.id, phone: multiCustomerPhone },
  });
  if (!sunshineCustomer) {
    sunshineCustomer = await prisma.customerRecord.create({
      data: {
        tenantId: sunshine.id,
        name: multiCustomerName,
        phone: multiCustomerPhone,
        email: multiCustomerEmail,
        address: '5B Banana Island Road, Ikoyi, Lagos',
        city: 'Lagos',
      },
    });
  }

  await prisma.customerTenantRelationship.upsert({
    where: {
      tenantId_customerRecordId: {
        tenantId: sunshine.id,
        customerRecordId: sunshineCustomer.id,
      },
    },
    update: {
      identityId: identity.id,
      status: 'ACTIVE',
    },
    create: {
      tenantId: sunshine.id,
      customerRecordId: sunshineCustomer.id,
      identityId: identity.id,
      status: 'ACTIVE',
    },
  });

  // Customer Record at GreenPower Energy
  let greenpowerCustomer = await prisma.customerRecord.findFirst({
    where: { tenantId: greenpower.id, phone: multiCustomerPhone },
  });
  if (!greenpowerCustomer) {
    greenpowerCustomer = await prisma.customerRecord.create({
      data: {
        tenantId: greenpower.id,
        name: multiCustomerName,
        phone: multiCustomerPhone,
        email: multiCustomerEmail,
        address: 'Suite 400 Central Business Park, Abuja',
        city: 'Abuja',
      },
    });
  }

  await prisma.customerTenantRelationship.upsert({
    where: {
      tenantId_customerRecordId: {
        tenantId: greenpower.id,
        customerRecordId: greenpowerCustomer.id,
      },
    },
    update: {
      identityId: identity.id,
      status: 'ACTIVE',
    },
    create: {
      tenantId: greenpower.id,
      customerRecordId: greenpowerCustomer.id,
      identityId: identity.id,
      status: 'ACTIVE',
    },
  });

  console.log(`✓ Multi-Company Customer ready: ${multiCustomerName} (${multiCustomerPhone})`);
  console.log(`  -> Linked to Sunshine Solar Ltd (/s/sunshine-solar)`);
  console.log(`  -> Linked to GreenPower Energy Ltd (/s/greenpower)`);

  // 2. Seed Contextual Invitation for "Engr. Fatima Bello"
  const inviteCustomerPhone = '+2348039998877';
  const inviteCustomerEmail = 'fatima.bello@example.com';
  const inviteCustomerName = 'Engr. Fatima Bello';

  let inviteCustomer = await prisma.customerRecord.findFirst({
    where: { tenantId: sunshine.id, phone: inviteCustomerPhone },
  });
  if (!inviteCustomer) {
    inviteCustomer = await prisma.customerRecord.create({
      data: {
        tenantId: sunshine.id,
        name: inviteCustomerName,
        phone: inviteCustomerPhone,
        email: inviteCustomerEmail,
        address: '18 Admiralty Way, Lekki Phase 1, Lagos',
        city: 'Lagos',
      },
    });
  }

  const inviteRel = await prisma.customerTenantRelationship.upsert({
    where: {
      tenantId_customerRecordId: {
        tenantId: sunshine.id,
        customerRecordId: inviteCustomer.id,
      },
    },
    update: {
      status: 'INVITATION_PENDING',
    },
    create: {
      tenantId: sunshine.id,
      customerRecordId: inviteCustomer.id,
      status: 'INVITATION_PENDING',
    },
  });

  const demoPlainToken = 'demo-invite-sunshine-2026';
  const demoTokenHash = TokenUtil.hashToken(demoPlainToken);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h validity

  await prisma.invitation.upsert({
    where: { tokenHash: demoTokenHash },
    update: {
      relationshipId: inviteRel.id,
      status: 'PENDING',
      expiresAt,
    },
    create: {
      tokenHash: demoTokenHash,
      relationshipId: inviteRel.id,
      status: 'PENDING',
      expiresAt,
    },
  });

  console.log(`✓ Contextual Invite token ready: ${demoPlainToken}`);
  console.log(`  -> URL: http://localhost:3000/s/sunshine-solar/invite/${demoPlainToken}`);
  console.log('Day 15 Seeding Complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
