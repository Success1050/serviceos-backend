import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Searching for customer "Homie blessing"...');

  const customer = await prisma.customerRecord.findFirst({
    where: {
      name: {
        contains: 'Homie',
        mode: 'insensitive',
      },
    },
    include: {
      tenant: true,
      relationships: true,
    },
  });

  if (!customer) {
    console.error('Customer "Homie blessing" not found!');
    const all = await prisma.customerRecord.findMany({
      take: 10,
      select: { id: true, name: true, phone: true, email: true, tenantId: true },
    });
    console.log('Available customers:', all);
    return;
  }

  console.log(`Found Customer: ${customer.name} (ID: ${customer.id}) in Tenant: ${customer.tenant.name} (${customer.tenant.slug})`);

  // 1. Create a fresh SENT Quote for Homie blessing
  const quoteTitle = '15kWh Lithium-Ion Battery Storage & Smart Hybrid Inverter Expansion';
  const quoteAmount = 4300000;

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

  const quote = await prisma.quote.create({
    data: {
      tenantId: customer.tenantId,
      customerRecordId: customer.id,
      title: quoteTitle,
      amount: quoteAmount,
      status: 'SENT',
      billingType: 'MILESTONE',
      termsAndConditions: rawTerms,
      milestones: {
        create: [
          {
            tenantId: customer.tenantId,
            title: 'Commitment Deposit & Hardware Staging (50%)',
            percentage: 50,
            amount: 2150000,
            order: 1,
            status: 'PENDING',
          },
          {
            tenantId: customer.tenantId,
            title: 'Delivery to Site & Battery Mounting (30%)',
            percentage: 30,
            amount: 1290000,
            order: 2,
            status: 'PENDING',
          },
          {
            tenantId: customer.tenantId,
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

  console.log(`\n🎉 SEEDED QUOTE FOR HOMIE BLESSING:`);
  console.log(`- Quote ID: ${quote.id}`);
  console.log(`- Title: ${quote.title}`);
  console.log(`- Amount: ₦${quoteAmount.toLocaleString('en-NG')}`);
  console.log(`- Status: SENT (Awaiting Signature)`);
  console.log(`- Direct Testing URL: http://localhost:3000/s/${customer.tenant.slug}/quotes/${quote.id}`);

  // 2. Create a live SENT Invoice for Homie blessing
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: customer.tenantId,
      customerRecordId: customer.id,
      title: 'Invoice for Annual Solar System Health Audit & Panel Cleaning',
      amount: 85000,
      status: 'SENT',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`\n🎉 SEEDED INVOICE FOR HOMIE BLESSING:`);
  console.log(`- Invoice ID: ${invoice.id}`);
  console.log(`- Title: ${invoice.title}`);
  console.log(`- Amount: ₦85,000.00`);
  console.log(`- Status: SENT (Ready for Pay Now)`);
  console.log(`- Customer Dashboard URL: http://localhost:3000/s/${customer.tenant.slug}/dashboard`);
}

main()
  .catch((err) => {
    console.error('Error:', err);
  })
  .finally(() => {
    prisma.$disconnect();
  });
