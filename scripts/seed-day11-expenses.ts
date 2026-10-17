import { PrismaClient, ExpenseStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Day 11 Field Expenses...');

  const tenants = await prisma.tenant.findMany({
    include: {
      users: { where: { isFieldTech: true } },
      jobs: { take: 5 },
    },
  });

  if (tenants.length === 0) {
    console.error('No tenants found.');
    return;
  }

  for (const tenant of tenants) {
    console.log(`Checking expenses for tenant: ${tenant.name} (${tenant.id})`);

    const tech = tenant.users[0] || (await prisma.user.findFirst({ where: { tenantId: tenant.id } }));
    const job = tenant.jobs[0] || (await prisma.job.findFirst({ where: { tenantId: tenant.id } }));

    if (!tech || !job) {
      console.warn(`Skipping tenant ${tenant.name}: No technician or job found.`);
      continue;
    }

    const count = await prisma.expenseReceipt.count({ where: { tenantId: tenant.id } });
    if (count > 0) {
      console.log(`Tenant already has ${count} expenses seeded.`);
      continue;
    }

    const sampleExpenses = [
      {
        jobId: job.id,
        technicianId: tech.id,
        amount: 15000,
        category: 'MATERIALS_PARTS',
        vendor: 'Alaba Electrical International Depot',
        notes: 'Urgent 10m 16mm² solar DC cabling purchased on-site for roof-to-inverter hookup.',
        receiptPhotoUrl: 'https://images.unsplash.com/photo-1554415707-9e49fe83083f?auto=format&fit=crop&w=800&q=80',
        status: ExpenseStatus.PENDING_APPROVAL,
        billToClient: true,
      },
      {
        jobId: job.id,
        technicianId: tech.id,
        amount: 32500,
        category: 'TOOLS_HARDWARE',
        vendor: 'Schneider & Havells Distributor, Ikeja',
        notes: '63A DC MCB breaker switch & surge protector replacement due to site voltage surge.',
        receiptPhotoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
        status: ExpenseStatus.PENDING_APPROVAL,
        billToClient: false,
      },
      {
        jobId: job.id,
        technicianId: tech.id,
        amount: 8500,
        category: 'TRANSPORT_FUEL',
        vendor: 'TotalEnergies Service Station, Lekki',
        notes: 'Emergency diesel generator refuel to power inverter commissioning calibration tools.',
        receiptPhotoUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
        status: ExpenseStatus.APPROVED,
        billToClient: false,
        reviewedAt: new Date(Date.now() - 86400000),
      },
    ];

    for (const exp of sampleExpenses) {
      await prisma.expenseReceipt.create({
        data: {
          tenantId: tenant.id,
          ...exp,
        },
      });
    }

    console.log(`Seeded ${sampleExpenses.length} sample expenses for ${tenant.name}.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
