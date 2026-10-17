import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Day 16 Customer Dashboard Demo Data (Sunshine Solar)...');

  const sunshine = await prisma.tenant.findUnique({ where: { slug: 'sunshine-solar' } });
  if (!sunshine) {
    console.error('Sunshine Solar tenant not found');
    process.exit(1);
  }

  const customerPhone = '+2348001112222';
  const customer = await prisma.customerRecord.findFirst({
    where: { tenantId: sunshine.id, phone: customerPhone },
  });

  if (!customer) {
    console.error('Customer Chief John Okafor not found in Sunshine Solar');
    process.exit(1);
  }

  // 1. Ensure a Technician exists with rich profile
  let technician = await prisma.user.findFirst({
    where: { tenantId: sunshine.id },
  });

  if (!technician) {
    technician = await prisma.user.create({
      data: {
        email: 'engr.emeka@sunshinesolar.ng',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890123456789012',
        firstName: 'Emeka',
        lastName: 'Okonkwo',
        phone: '+2348011223344',
        tenantId: sunshine.id,
        avatarUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
        bio: 'Senior Clean Energy Systems Engineer with 9+ years experience. Specializes in Victron Inverters, Lithium storage banks, and high-voltage PV arrays.',
        certifications: ['Certified Solar PV Engineer', 'Victron Energy Certified Professional', 'COREN Registered'],
        rating: 4.95,
        jobsCompletedCount: 148,
      },
    });
    console.log(`✓ Created Technician: ${technician.firstName} ${technician.lastName}`);
  } else {
    // Update technician with avatar and rating if missing
    technician = await prisma.user.update({
      where: { id: technician.id },
      data: {
        avatarUrl: technician.avatarUrl || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
        bio: technician.bio || 'Senior Clean Energy Systems Engineer with 9+ years experience. Specializes in Victron Inverters and Lithium storage banks.',
        rating: technician.rating || 4.95,
      },
    });
    console.log(`✓ Using Technician: ${technician.firstName} ${technician.lastName}`);
  }

  // 2. Seed Installed Solar System (Asset)
  const existingAsset = await prisma.asset.findFirst({
    where: { tenantId: sunshine.id, customerRecordId: customer.id },
  });

  let asset = existingAsset;
  if (!asset) {
    asset = await prisma.asset.create({
      data: {
        tenantId: sunshine.id,
        customerRecordId: customer.id,
        name: '10kVA Hybrid Residential Solar System',
        manufacturer: 'Victron Energy & Felicity Solar',
        modelNumber: 'MultiPlus-II 48/10000/140-100',
        serialNumber: 'VIC-48V-10K-99281',
        installDate: new Date('2025-06-15'),
        warrantyExpiresAt: new Date('2030-06-15'), // 5-year warranty
        warrantyDocumentUrl: 'https://sunshinesolar.ng/docs/warranty-certificate-10kva.pdf',
        status: 'ACTIVE',
        maintenanceSchedules: {
          create: [
            {
              tenantId: sunshine.id,
              customerRecordId: customer.id,
              title: 'Quarterly Inverter Cleaning & Cable Torque Inspection',
              intervalMonths: 3,
              nextDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // in 14 days
              status: 'ACTIVE',
            },
          ],
        },
      },
    });
    console.log(`✓ Seeded Asset: ${asset.name} (${asset.serialNumber})`);
  } else {
    console.log(`✓ Asset already exists: ${asset.name}`);
  }

  // 3. Seed Quotes
  const existingQuote = await prisma.quote.findFirst({
    where: { tenantId: sunshine.id, customerRecordId: customer.id },
  });

  if (!existingQuote) {
    await prisma.quote.create({
      data: {
        tenantId: sunshine.id,
        customerRecordId: customer.id,
        title: '15kWh Lithium-Ion Battery Bank Expansion (3x 48V Felicity Wall-Mount)',
        amount: 3200000,
        status: 'SENT',
        billingType: 'FIXED',
        termsAndConditions: 'Standard 5-year replacement warranty with professional installation and DC disconnect box inclusion.',
      },
    });
    console.log(`✓ Seeded Quote: 15kWh Battery Expansion`);
  } else {
    console.log(`✓ Quote already exists`);
  }

  // 4. Seed Invoices
  const existingInvoices = await prisma.invoice.findMany({
    where: { tenantId: sunshine.id, customerRecordId: customer.id },
  });

  if (existingInvoices.length === 0) {
    // Unpaid invoice
    await prisma.invoice.create({
      data: {
        tenantId: sunshine.id,
        customerRecordId: customer.id,
        title: 'Q1 Scheduled Comprehensive Solar Preventative Maintenance',
        amount: 45000,
        status: 'SENT',
      },
    });

    // Paid invoice
    await prisma.invoice.create({
      data: {
        tenantId: sunshine.id,
        customerRecordId: customer.id,
        title: '10kVA Victron Hybrid Solar Turnkey System Installation',
        amount: 5400000,
        status: 'PAID',
      },
    });
    console.log(`✓ Seeded Invoices: Outstanding ₦45,000 and Paid ₦5,400,000`);
  } else {
    console.log(`✓ Invoices already exist (${existingInvoices.length})`);
  }

  // 5. Seed Jobs (Upcoming Scheduled Job + Past Completed Job)
  const existingJobs = await prisma.job.findMany({
    where: { tenantId: sunshine.id, customerRecordId: customer.id },
  });

  if (existingJobs.length === 0) {
    // Upcoming scheduled job
    await prisma.job.create({
      data: {
        tenantId: sunshine.id,
        customerRecordId: customer.id,
        assignedTechnicianId: technician.id,
        title: 'Annual Solar System Efficiency Audit & Battery Balancing',
        description: 'Comprehensive health check: thermal imaging on DC terminals, PV string open-circuit voltage tests, and firmware upgrade.',
        status: 'SCHEDULED',
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // in 3 days, 10:00 AM
        estimatedDuration: 120,
      },
    });

    // Past completed job
    await prisma.job.create({
      data: {
        tenantId: sunshine.id,
        customerRecordId: customer.id,
        assignedTechnicianId: technician.id,
        title: 'Initial 10kVA Solar PV System Installation & Commissioning',
        description: 'Complete rooftop rail mounting of 16x 550W Canadian Solar panels and indoor inverter hookup.',
        status: 'COMPLETED',
        scheduledAt: new Date('2025-06-15T09:00:00Z'),
        startedAt: new Date('2025-06-15T09:15:00Z'),
        completedAt: new Date('2025-06-15T16:30:00Z'),
        estimatedDuration: 420,
      },
    });
    console.log(`✓ Seeded Upcoming Scheduled Job & Past Completed Installation Job`);
  } else {
    console.log(`✓ Jobs already exist (${existingJobs.length})`);
  }

  console.log('✓ Day 16 Customer Dashboard seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
