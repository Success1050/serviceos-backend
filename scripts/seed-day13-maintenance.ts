import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Day 13 Recurring Maintenance Contracts...');

  const tenants = await prisma.tenant.findMany({
    include: {
      customerRecords: {
        include: {
          assets: true,
        },
        take: 5,
      },
      jobs: { take: 5 },
    },
  });

  if (tenants.length === 0) {
    console.error('No tenants found.');
    return;
  }

  for (const tenant of tenants) {
    console.log(`Checking maintenance schedules for: ${tenant.name} (${tenant.id})`);

    const count = await prisma.maintenanceSchedule.count({
      where: { tenantId: tenant.id },
    });

    if (count >= 3) {
      console.log(`Tenant already has ${count} maintenance schedules seeded.`);
      continue;
    }

    const customers = tenant.customerRecords;
    if (customers.length === 0) {
      console.warn(`No customers found for tenant ${tenant.name}, skipping.`);
      continue;
    }

    const c1 = customers[0];
    const c2 = customers[1] || customers[0];
    const c3 = customers[2] || customers[0];

    const a1 = c1.assets[0];
    const a2 = c2.assets[0];

    const now = Date.now();

    const sampleContracts = [
      {
        tenantId: tenant.id,
        customerRecordId: c1.id,
        assetId: a1?.id || null,
        title: 'Quarterly Solar Array & Hybrid Inverter Health Inspection',
        intervalMonths: 3,
        nextDueDate: new Date(now + 1000 * 60 * 60 * 24 * 5), // Due in 5 days (Due soon!)
        status: 'ACTIVE' as const,
        currentJobId: tenant.jobs[0]?.id || null,
      },
      {
        tenantId: tenant.id,
        customerRecordId: c2.id,
        assetId: a2?.id || null,
        title: 'Biannual Lithium Storage Battery Capacity & BMS Calibration',
        intervalMonths: 6,
        nextDueDate: new Date(now + 1000 * 60 * 60 * 24 * 22), // Due in 22 days (Due soon!)
        status: 'ACTIVE' as const,
        currentJobId: null,
      },
      {
        tenantId: tenant.id,
        customerRecordId: c3.id,
        assetId: null,
        title: 'Annual Full Solar PV Panel Thermal Scan & Wiring Overhaul',
        intervalMonths: 12,
        nextDueDate: new Date(now + 1000 * 60 * 60 * 24 * 90), // Due in 3 months
        status: 'ACTIVE' as const,
        currentJobId: null,
      },
      {
        tenantId: tenant.id,
        customerRecordId: c1.id,
        assetId: a1?.id || null,
        title: 'Monthly Standby Diesel Backup Generator Load Bank Testing',
        intervalMonths: 1,
        nextDueDate: new Date(now + 1000 * 60 * 60 * 24 * 14), // Due in 14 days
        status: 'PAUSED' as const,
        currentJobId: null,
      },
    ];

    for (const contract of sampleContracts) {
      await prisma.maintenanceSchedule.create({ data: contract });
    }

    console.log(`Seeded ${sampleContracts.length} recurring maintenance contracts for ${tenant.name}.`);
  }

  console.log('Day 13 Maintenance Seeding Complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
