import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Day 12 Real-Time Notifications...');

  const tenants = await prisma.tenant.findMany({
    include: {
      users: { take: 3 },
    },
  });

  if (tenants.length === 0) {
    console.error('No tenants found.');
    return;
  }

  for (const tenant of tenants) {
    console.log(`Checking notifications for tenant: ${tenant.name} (${tenant.id})`);
    const ownerOrManager = tenant.users[0];

    const count = await prisma.notification.count({ where: { tenantId: tenant.id } });
    if (count >= 5) {
      console.log(`Tenant already has ${count} notifications seeded.`);
      continue;
    }

    const sampleNotifications = [
      {
        tenantId: tenant.id,
        userId: ownerOrManager?.id || null,
        title: 'Quote #QT-8821 Accepted by Client',
        message: 'Sunshine Estates has accepted the 10kW Hybrid Solar Installation quote for ₦4,850,000.',
        type: 'QUOTE',
        isRead: false,
        linkUrl: '/app/quotes',
        createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
      },
      {
        tenantId: tenant.id,
        userId: ownerOrManager?.id || null,
        title: 'Payment Received: ₦1,450,000 (Paystack)',
        message: 'Escrow deposit of ₦1,450,000 confirmed for Invoice #INV-2026-089. Funds credited to operational wallet.',
        type: 'PAYMENT',
        isRead: false,
        linkUrl: '/app/invoices',
        createdAt: new Date(Date.now() - 1000 * 60 * 25), // 25 mins ago
      },
      {
        tenantId: tenant.id,
        userId: ownerOrManager?.id || null,
        title: 'Technician En Route: Job #JB-1049',
        message: 'Tech Tunde Adebayo checked in on GPS and is traveling to site: 14 Victoria Island, Lagos.',
        type: 'JOB',
        isRead: false,
        linkUrl: '/app/dispatch',
        createdAt: new Date(Date.now() - 1000 * 60 * 50), // 50 mins ago
      },
      {
        tenantId: tenant.id,
        userId: ownerOrManager?.id || null,
        title: 'New Urgent Support Ticket #TK-304',
        message: 'Felicity 10kWh battery BMS communication alarm reported at Lekki Phase 1 branch site.',
        type: 'SUPPORT',
        isRead: false,
        linkUrl: '/app/support',
        createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      },
      {
        tenantId: tenant.id,
        userId: ownerOrManager?.id || null,
        title: 'Field Expense Claim Submitted: ₦15,000',
        message: 'Technician John submitted a parts receipt from Alaba Electrical Depot requiring manager sign-off.',
        type: 'EXPENSE',
        isRead: true,
        linkUrl: '/app/expenses',
        createdAt: new Date(Date.now() - 1000 * 60 * 360), // 6 hours ago
      },
      {
        tenantId: tenant.id,
        userId: null, // Tenant-wide
        title: 'Warehouse Stock Level Alert',
        message: 'Master Warehouse stock for 5kW Deye Inverters reached reorder threshold (3 units remaining).',
        type: 'INVENTORY',
        isRead: true,
        linkUrl: '/app/inventory',
        createdAt: new Date(Date.now() - 1000 * 60 * 720), // 12 hours ago
      },
    ];

    for (const item of sampleNotifications) {
      await prisma.notification.create({ data: item });
    }

    console.log(`Seeded ${sampleNotifications.length} sample notifications for ${tenant.name}.`);
  }

  console.log('Day 12 Notification Seeding Complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
