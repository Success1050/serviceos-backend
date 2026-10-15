import { PrismaClient, WarehouseType, RequestStatus, JobStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting comprehensive seeding for Day 9 (Dispatch & Scheduling) and Day 10 (Warehouses & Virtual Trucks)...');

  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Fetch all tenants so we can seed for each active tenant
  const tenants = await prisma.tenant.findMany();
  if (tenants.length === 0) {
    console.error('No tenants found in the database. Please ensure a tenant exists.');
    return;
  }

  console.log(`Found ${tenants.length} tenants. Seeding Day 9 & Day 10 data...`);

  for (const tenant of tenants) {
    console.log(`\n========================================`);
    console.log(`🏢 Seeding for Tenant: ${tenant.name} (${tenant.id})`);
    console.log(`========================================`);

    // Ensure Roles have all necessary dispatch & warehouse permissions
    await prisma.role.updateMany({
      where: { tenantId: tenant.id },
      data: {
        permissions: [
          '*',
          'manage_jobs',
          'manage_customers',
          'manage_quotes',
          'manage_invoices',
          'warehouse_view',
          'warehouse_create',
          'equipment_request_create',
          'equipment_request_approve',
          'admin_access',
        ],
      },
    });

    // 2. Seed Field Technicians
    const techData = [
      {
        email: `tech.babajide_${tenant.slug || tenant.id.slice(0, 6)}@serviceos.ng`,
        firstName: 'Babajide',
        lastName: 'Adeleke',
        phone: '+234 803 294 1001',
        tradeSpecialty: 'Solar PV & High-Voltage Electrician',
      },
      {
        email: `tech.chinedu_${tenant.slug || tenant.id.slice(0, 6)}@serviceos.ng`,
        firstName: 'Chinedu',
        lastName: 'Okonkwo',
        phone: '+234 812 559 8832',
        tradeSpecialty: 'Lithium Battery & Inverter Specialist',
      },
      {
        email: `tech.emmanuel_${tenant.slug || tenant.id.slice(0, 6)}@serviceos.ng`,
        firstName: 'Emmanuel',
        lastName: 'Suleiman',
        phone: '+234 809 112 4490',
        tradeSpecialty: 'Commercial HVAC & Heat Pump Specialist',
      },
      {
        email: `tech.fadekemi_${tenant.slug || tenant.id.slice(0, 6)}@serviceos.ng`,
        firstName: 'Fadekemi',
        lastName: 'Williams',
        phone: '+234 901 883 2219',
        tradeSpecialty: 'Roofing Structural & Mounting Engineer',
      },
    ];

    const technicians: any[] = [];
    for (const t of techData) {
      const tech = await prisma.user.upsert({
        where: { email: t.email },
        update: {
          tenantId: tenant.id,
          firstName: t.firstName,
          lastName: t.lastName,
          phone: t.phone,
          isFieldTech: true,
          tradeSpecialty: t.tradeSpecialty,
          passwordHash,
          status: 'ACTIVE',
        },
        create: {
          email: t.email,
          firstName: t.firstName,
          lastName: t.lastName,
          phone: t.phone,
          isFieldTech: true,
          tradeSpecialty: t.tradeSpecialty,
          tenantId: tenant.id,
          passwordHash,
          status: 'ACTIVE',
        },
      });
      technicians.push(tech);
    }
    console.log(`✓ Seeded ${technicians.length} field technicians`);

    // 3. Seed Customers
    const customerData = [
      {
        name: 'Alhaji Ibrahim Danjuma Estate',
        email: `danjuma_${tenant.id.slice(0, 6)}@estate.ng`,
        phone: '+234 802 334 1122',
        address: '18 Gana Street, Maitama, Abuja',
        city: 'Abuja',
      },
      {
        name: 'Eko Atlantic Diagnostic Hospital',
        email: `facilities_${tenant.id.slice(0, 6)}@ekoatlantic.ng`,
        phone: '+234 803 998 4433',
        address: 'Block 8, Admiralty Way, Lekki Phase 1, Lagos',
        city: 'Lagos',
      },
      {
        name: 'Zenith Plaza Commercial Towers',
        email: `maintenance_${tenant.id.slice(0, 6)}@zenithplaza.com`,
        phone: '+234 809 111 2233',
        address: 'Plot 14B, Victoria Island Expressway, Lagos',
        city: 'Lagos',
      },
      {
        name: 'Dangote Logistics & Distribution Hub',
        email: `hub_${tenant.id.slice(0, 6)}@dangote-logistics.com`,
        phone: '+234 805 777 8899',
        address: 'Km 24, Lekki-Epe Expressway, Ibeju-Lekki',
        city: 'Lagos',
      },
    ];

    const customers: any[] = [];
    for (const c of customerData) {
      let cust = await prisma.customerRecord.findFirst({
        where: { tenantId: tenant.id, name: c.name },
      });
      if (!cust) {
        cust = await prisma.customerRecord.create({
          data: {
            tenantId: tenant.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            address: c.address,
            city: c.city,
          },
        });
      }
      customers.push(cust);
    }
    console.log(`✓ Seeded ${customers.length} customer sites`);

    // 4. Seed Quotes
    const quote1 = await prisma.quote.upsert({
      where: { id: `quote-com-${tenant.id.slice(0, 8)}` },
      update: {},
      create: {
        id: `quote-com-${tenant.id.slice(0, 8)}`,
        tenantId: tenant.id,
        customerRecordId: customers[0].id,
        title: '10kVA Commercial Hybrid Solar Installation',
        amount: 4850000,
        status: 'ACCEPTED',
      },
    });

    const quote2 = await prisma.quote.upsert({
      where: { id: `quote-res-${tenant.id.slice(0, 8)}` },
      update: {},
      create: {
        id: `quote-res-${tenant.id.slice(0, 8)}`,
        tenantId: tenant.id,
        customerRecordId: customers[1].id,
        title: '5kVA Solar Storage & Battery Replacement',
        amount: 1650000,
        status: 'ACCEPTED',
      },
    });
    console.log(`✓ Seeded commercial quotes`);

    // 5. Seed Work Order Jobs (Day 9)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

    // Job 1: Scheduled Today at 09:00 AM (Babajide)
    const slot9am = new Date(`${dateStr}T09:00:00.000Z`);
    await prisma.job.upsert({
      where: { id: `job-01-sched-${tenant.id.slice(0, 8)}` },
      update: {
        scheduledAt: slot9am,
        status: JobStatus.SCHEDULED,
        assignedTechnicianId: technicians[0].id,
      },
      create: {
        id: `job-01-sched-${tenant.id.slice(0, 8)}`,
        tenantId: tenant.id,
        customerRecordId: customers[0].id,
        quoteId: quote1.id,
        assignedTechnicianId: technicians[0].id,
        title: '10kVA Commercial Inverter Preventive Maintenance',
        description: 'Complete inspection of inverter DC inputs, firmware update, and safety check.',
        status: JobStatus.SCHEDULED,
        scheduledAt: slot9am,
        estimatedDuration: 120, // 09:00 - 11:00
      },
    });

    // Job 2: Conflict Test Job (Babajide at 10:00 AM - Overlaps Job 1!)
    const slot10am = new Date(`${dateStr}T10:00:00.000Z`);
    await prisma.job.upsert({
      where: { id: `job-02-conflict-${tenant.id.slice(0, 8)}` },
      update: {
        scheduledAt: slot10am,
        status: JobStatus.SCHEDULED,
        assignedTechnicianId: technicians[0].id,
      },
      create: {
        id: `job-02-conflict-${tenant.id.slice(0, 8)}`,
        tenantId: tenant.id,
        customerRecordId: customers[1].id,
        assignedTechnicianId: technicians[0].id,
        title: 'Emergency High-Voltage Transformer Safety Audit',
        description: 'Immediate diagnostic on circuit fluctuation (overlaps 09:00-11:00 slot for conflict testing).',
        status: JobStatus.SCHEDULED,
        scheduledAt: slot10am,
        estimatedDuration: 60, // 10:00 - 11:00
      },
    });

    // Job 3: In-Field Active (Chinedu at 11:30 AM)
    const slot1130am = new Date(`${dateStr}T11:30:00.000Z`);
    await prisma.job.upsert({
      where: { id: `job-03-active-${tenant.id.slice(0, 8)}` },
      update: {
        scheduledAt: slot1130am,
        status: JobStatus.IN_PROGRESS,
        assignedTechnicianId: technicians[1].id,
      },
      create: {
        id: `job-03-active-${tenant.id.slice(0, 8)}`,
        tenantId: tenant.id,
        customerRecordId: customers[2].id,
        quoteId: quote2.id,
        assignedTechnicianId: technicians[1].id,
        title: 'Lithium LiFePO4 Battery Bank Thermal Balancing',
        description: 'Currently deployed technician on-site performing high-precision cell voltage calibration.',
        status: JobStatus.IN_PROGRESS,
        scheduledAt: slot1130am,
        estimatedDuration: 90,
      },
    });

    // Job 4: Unassigned Queue Job 1
    await prisma.job.upsert({
      where: { id: `job-04-unassigned1-${tenant.id.slice(0, 8)}` },
      update: {
        assignedTechnicianId: null,
        scheduledAt: null,
      },
      create: {
        id: `job-04-unassigned1-${tenant.id.slice(0, 8)}`,
        tenantId: tenant.id,
        customerRecordId: customers[3].id,
        assignedTechnicianId: null,
        title: '5kVA Hybrid Solar Inverter Diagnostic & Inspection',
        description: 'Perform full circuit voltage check, battery terminal torque testing, and load safety test.',
        status: JobStatus.SCHEDULED,
        scheduledAt: null,
        estimatedDuration: 60,
      },
    });

    // Job 5: Unassigned Queue Job 2
    await prisma.job.upsert({
      where: { id: `job-05-unassigned2-${tenant.id.slice(0, 8)}` },
      update: {
        assignedTechnicianId: null,
        scheduledAt: null,
      },
      create: {
        id: `job-05-unassigned2-${tenant.id.slice(0, 8)}`,
        tenantId: tenant.id,
        customerRecordId: customers[0].id,
        assignedTechnicianId: null,
        title: 'Rooftop Solar Array Deep Cleaning & Thermographic Scan',
        description: 'Bi-annual panel decontamination and infrared inspection for micro-cracks.',
        status: JobStatus.SCHEDULED,
        scheduledAt: null,
        estimatedDuration: 120,
      },
    });

    // Job 6: Unassigned Queue Job 3
    await prisma.job.upsert({
      where: { id: `job-06-unassigned3-${tenant.id.slice(0, 8)}` },
      update: {
        assignedTechnicianId: null,
        scheduledAt: null,
      },
      create: {
        id: `job-06-unassigned3-${tenant.id.slice(0, 8)}`,
        tenantId: tenant.id,
        customerRecordId: customers[1].id,
        assignedTechnicianId: null,
        title: 'Heat Pump Expansion Valve Calibration & Leak Test',
        description: 'Inspect refrigerant pressures and calibrate electronic expansion valves.',
        status: JobStatus.SCHEDULED,
        scheduledAt: null,
        estimatedDuration: 45,
      },
    });
    console.log(`✓ Seeded Day 9 Work Orders (Scheduled, Conflicts, In-Field Active, and Unassigned Queue)`);

    // 6. Seed Product Catalog (Day 10)
    const productCatalogData = [
      { name: '5kVA Hybrid Solar Inverter', sku: 'INV-HYB-5KVA', price: 450000 },
      { name: '10kVA Commercial 3-Phase Inverter', sku: 'INV-COM-10KVA', price: 1250000 },
      { name: '48V 100Ah Lithium LiFePO4 Battery Rack', sku: 'BAT-LIFE-48V', price: 680000 },
      { name: '450W Monocrystalline Solar Panel', sku: 'PV-MONO-450W', price: 85000 },
      { name: '16mm² Solar DC Twin-Core Cable (100m)', sku: 'CAB-DC-16MM', price: 65000 },
      { name: 'Surge Protection Device & DC Combiner Box', sku: 'BOX-SPD-DC4', price: 38000 },
    ];

    const products: any[] = [];
    for (const p of productCatalogData) {
      let prod = await prisma.productCatalog.findFirst({
        where: { tenantId: tenant.id, sku: p.sku },
      });
      if (!prod) {
        prod = await prisma.productCatalog.create({
          data: {
            tenantId: tenant.id,
            name: p.name,
            sku: p.sku,
            price: p.price,
          },
        });
      }
      products.push(prod);
    }
    console.log(`✓ Seeded ${products.length} catalog products`);

    // 7. Seed Warehouses (Day 10)
    // Master Central Warehouse (HQ)
    let masterWarehouse = await prisma.warehouse.findFirst({
      where: { tenantId: tenant.id, type: WarehouseType.HQ_WAREHOUSE, name: { contains: 'Master' } },
    });
    if (!masterWarehouse) {
      masterWarehouse = await prisma.warehouse.create({
        data: {
          tenantId: tenant.id,
          name: 'Central Logistics Master Hub - Lagos',
          type: WarehouseType.HQ_WAREHOUSE,
        },
      });
    }

    // Regional Depot
    let regionalWarehouse = await prisma.warehouse.findFirst({
      where: { tenantId: tenant.id, type: WarehouseType.HQ_WAREHOUSE, name: { contains: 'Regional' } },
    });
    if (!regionalWarehouse) {
      regionalWarehouse = await prisma.warehouse.create({
        data: {
          tenantId: tenant.id,
          name: 'Regional Distribution Depot - Abuja',
          type: WarehouseType.HQ_WAREHOUSE,
        },
      });
    }

    // Virtual Truck for Babajide Adeleke
    let truck1 = await prisma.warehouse.findFirst({
      where: { tenantId: tenant.id, type: WarehouseType.VIRTUAL_TRUCK, assignedTechnicianId: technicians[0].id },
    });
    if (!truck1) {
      truck1 = await prisma.warehouse.create({
        data: {
          tenantId: tenant.id,
          name: `Truck #101 (${technicians[0].firstName} ${technicians[0].lastName})`,
          type: WarehouseType.VIRTUAL_TRUCK,
          assignedTechnicianId: technicians[0].id,
        },
      });
    }

    // Virtual Truck for Chinedu Okonkwo
    let truck2 = await prisma.warehouse.findFirst({
      where: { tenantId: tenant.id, type: WarehouseType.VIRTUAL_TRUCK, assignedTechnicianId: technicians[1].id },
    });
    if (!truck2) {
      truck2 = await prisma.warehouse.create({
        data: {
          tenantId: tenant.id,
          name: `Truck #102 (${technicians[1].firstName} ${technicians[1].lastName})`,
          type: WarehouseType.VIRTUAL_TRUCK,
          assignedTechnicianId: technicians[1].id,
        },
      });
    }
    console.log(`✓ Seeded Warehouses: Master Hub, Regional Depot, and 2 Technician Virtual Trucks`);

    // 8. Seed Stock Inventory Items (Day 10)
    // Stock Master Warehouse
    const masterStock = [
      { prodIndex: 0, qty: 25 },
      { prodIndex: 1, qty: 14 },
      { prodIndex: 2, qty: 40 },
      { prodIndex: 3, qty: 150 },
      { prodIndex: 4, qty: 60 },
      { prodIndex: 5, qty: 35 },
    ];
    for (const item of masterStock) {
      await prisma.inventoryItem.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: masterWarehouse.id,
            productId: products[item.prodIndex].id,
          },
        },
        update: { quantity: item.qty },
        create: {
          warehouseId: masterWarehouse.id,
          productId: products[item.prodIndex].id,
          quantity: item.qty,
        },
      });
    }

    // Stock Regional Warehouse
    const regionalStock = [
      { prodIndex: 0, qty: 8 },
      { prodIndex: 2, qty: 12 },
      { prodIndex: 3, qty: 45 },
      { prodIndex: 4, qty: 20 },
    ];
    for (const item of regionalStock) {
      await prisma.inventoryItem.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: regionalWarehouse.id,
            productId: products[item.prodIndex].id,
          },
        },
        update: { quantity: item.qty },
        create: {
          warehouseId: regionalWarehouse.id,
          productId: products[item.prodIndex].id,
          quantity: item.qty,
        },
      });
    }

    // Stock Truck 1 (Babajide)
    const truck1Stock = [
      { prodIndex: 0, qty: 2 }, // 2x 5kVA Inverters
      { prodIndex: 2, qty: 4 }, // 4x Lithium Batteries
      { prodIndex: 3, qty: 8 }, // 8x Solar Panels
      { prodIndex: 4, qty: 2 }, // 2x DC Cables
    ];
    for (const item of truck1Stock) {
      await prisma.inventoryItem.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: truck1.id,
            productId: products[item.prodIndex].id,
          },
        },
        update: { quantity: item.qty },
        create: {
          warehouseId: truck1.id,
          productId: products[item.prodIndex].id,
          quantity: item.qty,
        },
      });
    }

    // Stock Truck 2 (Chinedu)
    const truck2Stock = [
      { prodIndex: 1, qty: 1 }, // 1x 10kVA Inverter
      { prodIndex: 2, qty: 3 }, // 3x Lithium Batteries
      { prodIndex: 4, qty: 3 }, // 3x DC Cables
      { prodIndex: 5, qty: 4 }, // 4x Combiner Boxes
    ];
    for (const item of truck2Stock) {
      await prisma.inventoryItem.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: truck2.id,
            productId: products[item.prodIndex].id,
          },
        },
        update: { quantity: item.qty },
        create: {
          warehouseId: truck2.id,
          productId: products[item.prodIndex].id,
          quantity: item.qty,
        },
      });
    }
    console.log(`✓ Seeded stock quantities in Master Hub, Regional Depot, and Virtual Trucks`);

    // 9. Seed Equipment Requests (Day 10)
    // Pending Request: Regional Branch requests 3x 10kVA Inverters from Central Hub
    await prisma.equipmentRequest.upsert({
      where: { id: `req-01-pending-${tenant.id.slice(0, 8)}` },
      update: { status: RequestStatus.PENDING },
      create: {
        id: `req-01-pending-${tenant.id.slice(0, 8)}`,
        tenantId: tenant.id,
        hqWarehouseId: masterWarehouse.id,
        productId: products[1].id,
        quantity: 3,
        status: RequestStatus.PENDING,
      },
    });

    // Approved Request: 4x Solar Panels transferred to Virtual Truck
    await prisma.equipmentRequest.upsert({
      where: { id: `req-02-approved-${tenant.id.slice(0, 8)}` },
      update: { status: RequestStatus.APPROVED },
      create: {
        id: `req-02-approved-${tenant.id.slice(0, 8)}`,
        tenantId: tenant.id,
        hqWarehouseId: masterWarehouse.id,
        productId: products[3].id,
        quantity: 4,
        status: RequestStatus.APPROVED,
      },
    });
    console.log(`✓ Seeded equipment requests (Pending & Approved)`);
  }

  console.log('\n🎉 ALL Day 9 and Day 10 seed data successfully generated!');
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
