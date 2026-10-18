import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Day 17 Test Quote & Invoice for Digital Signature and Escrow Testing...');

  // 1. Find or create Sunshine Solar tenant
  let sunshine = await prisma.tenant.findUnique({ where: { slug: 'sunshine-solar' } });
  if (!sunshine) {
    sunshine = await prisma.tenant.create({
      data: {
        name: 'Sunshine Solar Ltd',
        slug: 'sunshine-solar',
      },
    });
    console.log('✓ Created Sunshine Solar tenant');
  }

  // 2. Find or create customer Chief John Okafor
  const customerPhone = '+2348001112222';
  let customer = await prisma.customerRecord.findFirst({
    where: { tenantId: sunshine.id, phone: customerPhone },
  });

  if (!customer) {
    customer = await prisma.customerRecord.create({
      data: {
        tenantId: sunshine.id,
        name: 'Chief John Okafor',
        email: 'john.okafor@lagosproperties.ng',
        phone: customerPhone,
        address: '24 Admiralty Way, Lekki Phase 1',
        city: 'Lagos',
      },
    });
    console.log('✓ Created Customer Record: Chief John Okafor');
  } else {
    console.log(`✓ Using Customer Record: ${customer.name} (${customer.id})`);
  }

  // 3. Ensure CustomerTenantRelationship exists
  let relationship = await prisma.customerTenantRelationship.findFirst({
    where: {
      tenantId: sunshine.id,
      customerRecordId: customer.id,
    },
  });

  if (!relationship) {
    relationship = await prisma.customerTenantRelationship.create({
      data: {
        tenantId: sunshine.id,
        customerRecordId: customer.id,
        status: 'ACTIVE',
      },
    });
    console.log('✓ Created CustomerTenantRelationship');
  }

  // 4. Create an Itemized Quote in SENT status ready for signing
  const quoteTitle = '15kWh Lithium-Ion Battery Storage & Smart Hybrid Inverter Expansion';
  const quoteAmount = 4300000;

  // Metadata packed into terms comment
  const metadata = {
    items: [
      {
        description: '3x Felicity Solar 48V 100Ah LiFePO4 Lithium Battery Rack Modules (15kWh Usable Storage)',
        quantity: 3,
        unitPrice: 800000,
        total: 2400000,
        category: 'STORAGE',
      },
      {
        description: 'Victron MultiPlus-II 48/5000/70 Pure Sine Wave Inverter-Charger & Color Control GX',
        quantity: 1,
        unitPrice: 1200000,
        total: 1200000,
        category: 'INVERTER',
      },
      {
        description: 'DC Disconnect Enclosure, 200A Megafuse Block & 50mm² Double-Insulated Battery Cables',
        quantity: 1,
        unitPrice: 250000,
        total: 250000,
        category: 'ACCESSORIES',
      },
      {
        description: 'Certified Field Electrical Installation, Battery Balancing, Firmware Upgrade & Commissioning',
        quantity: 1,
        unitPrice: 150000,
        total: 150000,
        category: 'LABOR',
      },
    ],
    subtotal: 4000000,
    taxAmount: 300000,
    discountAmount: 0,
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Turnkey residential battery backup storage expansion designed for zero grid downtime during peak shedding periods.',
  };

  const rawTerms = `Standard 5-year replacement warranty on lithium battery modules and inverter equipment. Includes 12 months comprehensive workmanship guarantee and free quarterly health inspection.\n\n<!--serviceos-quote-meta:${JSON.stringify(metadata)}-->`;

  // Create or update Quote
  const quote = await prisma.quote.create({
    data: {
      tenantId: sunshine.id,
      customerRecordId: customer.id,
      title: quoteTitle,
      amount: quoteAmount,
      status: 'SENT',
      billingType: 'MILESTONE',
      termsAndConditions: rawTerms,
      milestones: {
        create: [
          {
            tenantId: sunshine.id,
            title: 'Commitment Deposit & Hardware Staging (50%)',
            percentage: 50,
            amount: 2150000,
            order: 1,
            status: 'PENDING',
          },
          {
            tenantId: sunshine.id,
            title: 'Delivery to Site & Battery Mounting (30%)',
            percentage: 30,
            amount: 1290000,
            order: 2,
            status: 'PENDING',
          },
          {
            tenantId: sunshine.id,
            title: 'Testing, Commissioning & Handover Sign-Off (20%)',
            percentage: 20,
            amount: 860000,
            order: 3,
            status: 'PENDING',
          },
        ],
      },
    },
  });

  console.log(`\n🎉 SEEDED QUOTE FOR TESTING:`);
  console.log(`- Quote ID: ${quote.id}`);
  console.log(`- Title: ${quote.title}`);
  console.log(`- Amount: ₦${quoteAmount.toLocaleString('en-NG')}`);
  console.log(`- Status: SENT (Awaiting Signature)`);
  console.log(`- Direct Testing URL: http://localhost:3000/s/sunshine-solar/quotes/${quote.id}`);

  // 5. Create a Live SENT Invoice for testing online payment
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: sunshine.id,
      customerRecordId: customer.id,
      title: 'Invoice for Annual Solar System Health Audit & Panel Cleaning',
      amount: 85000,
      status: 'SENT',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`\n🎉 SEEDED LIVE INVOICE FOR TESTING:`);
  console.log(`- Invoice ID: ${invoice.id}`);
  console.log(`- Title: ${invoice.title}`);
  console.log(`- Amount: ₦85,000.00`);
  console.log(`- Status: SENT (Ready for Pay Now)`);
  console.log(`- Customer Dashboard URL: http://localhost:3000/s/sunshine-solar/dashboard`);
  console.log(`- Backoffice Invoices URL: http://localhost:3000/app/invoices`);
}

main()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
