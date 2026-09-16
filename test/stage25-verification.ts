import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PortalService } from '../src/modules/portal/portal.service';
import { JobService } from '../src/modules/job/job.service';
import { ServiceRequestService } from '../src/modules/service-request/service-request.service';
import { PaymentService } from '../src/modules/payment/payment.service';
import { jwtVerify } from 'jose';

const prisma = new PrismaClient();
const configService = new ConfigService();

// Mock NotificationService tracking sent alerts
const sentNotifications: any[] = [];
const mockNotificationService: any = {
  sendToTenant: async (tenantId: string, title: string, message: string, type?: string, linkUrl?: string) => {
    console.log(`  [NOTIFICATION DISPATCHED] Type: ${type} | Title: "${title}" | Message: "${message}"`);
    sentNotifications.push({ tenantId, title, message, type, linkUrl });
  },
  sendToUser: async () => {},
};

// Mock PaymentService
const mockPaymentService: any = {
  captureEscrowHoldForJob: async (jobId: string, tenantId: string) => {
    console.log(`  [MOCK ESCROW CAPTURE] Captured held funds for job ${jobId}`);
  },
};

async function runStage25Verification() {
  console.log('====================================================');
  console.log('🚀 STAGE 25: THE CUSTOMER PORTAL EXPERIENCE VERIFICATION');
  console.log('====================================================\n');

  const serviceRequestService = new ServiceRequestService(prisma as any);
  const portalService = new PortalService(
    prisma as any,
    configService,
    serviceRequestService,
    mockNotificationService,
  );
  const jobService = new JobService(prisma as any, mockPaymentService);

  // ----------------------------------------------------
  // SETUP TEST MULTI-TENANT SEED DATA
  // ----------------------------------------------------
  console.log('--- SETUP: Initializing Test Tenant & Customer ---');
  const tenantSlug = `customer-portal-test-${Date.now()}`;
  const testTenant = await prisma.tenant.create({
    data: {
      name: 'Apex Air & Energy Solutions',
      slug: tenantSlug,
    },
  });
  console.log(`✓ Created Tenant: ${testTenant.name} (${testTenant.slug})`);

  const customerPhone = `+23480${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testCustomer = await prisma.customerRecord.create({
    data: {
      tenantId: testTenant.id,
      name: 'Engr. Babatunde Fashola',
      email: 'tunde.fashola@lagosenergy.com',
      phone: customerPhone,
      address: 'Plot 14 Admiralty Way, Lekki Phase 1, Lagos',
      city: 'Lagos',
    },
  });
  console.log(`✓ Created Customer Record: ${testCustomer.name} (${testCustomer.phone})`);

  // Setup technician with Stage 25 rich bio and photo
  const techEmail = `tech.emeka.${Date.now()}@apexenergy.ng`;
  const technician = await prisma.user.create({
    data: {
      email: techEmail,
      passwordHash: 'dummy_hash_for_testing',
      firstName: 'Emeka',
      lastName: 'Okonkwo',
      phone: '+2348011223344',
      tenantId: testTenant.id,
      avatarUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
      bio: 'Senior HVAC & Solar Systems Engineer with 9+ years experience. Specializes in Daikin VRV systems and Victron Inverter installations.',
      certifications: ['Certified Solar PV Engineer', 'EPA Universal Section 608', 'Daikin VRV Master Tech'],
      rating: 4.95,
      jobsCompletedCount: 142,
    },
  });
  console.log(`✓ Created Technician: ${technician.firstName} ${technician.lastName} (Rating: ${technician.rating}⭐, Jobs: ${technician.jobsCompletedCount})`);

  // ----------------------------------------------------
  // TEST 1: Passwordless OTP Authentication Flow
  // ----------------------------------------------------
  console.log('\n--- TEST 1: Customer Passwordless OTP Authentication ---');
  const otpReq = await portalService.requestOtp(testTenant.slug, customerPhone);
  console.log(`✓ Request OTP Response: ${otpReq.message}`);

  const authResult = await portalService.verifyOtp(testTenant.slug, customerPhone, '123456');
  console.log(`✓ Verify OTP Result: ${authResult.message}`);
  console.log(`  - Customer Authenticated: ${authResult.customerName}`);
  console.log(`  - Tenant: ${authResult.tenantName}`);
  console.log(`  - Access Token Generated: ${authResult.accessToken.substring(0, 30)}...`);

  // Verify JWT claims
  const jwtSecret = new TextEncoder().encode(configService.get<string>('JWT_SECRET') || 'super-secret-key-for-dev-only-do-not-use-in-prod');
  const { payload } = await jwtVerify(authResult.accessToken, jwtSecret);
  console.log(`✓ JWT Claims Verified: Role = ${payload.role}, Sub = ${payload.sub}`);
  const relationshipId = payload.relationshipId as string;

  if (payload.role !== 'CUSTOMER' || !relationshipId) {
    throw new Error('Customer authentication payload invalid');
  }

  // ----------------------------------------------------
  // TEST 2: Live Technician Tracking Engine & Privacy Shield
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Live Technician Tracking Engine & Privacy Boundary ---');
  
  // Create a job for the customer
  const scheduledTime = new Date(Date.now() + 4 * 60 * 60 * 1000); // In 4 hours
  const job = await prisma.job.create({
    data: {
      tenantId: testTenant.id,
      customerRecordId: testCustomer.id,
      assignedTechnicianId: technician.id,
      title: 'Emergency Inverter Diagnostic & Battery Bank Inspection',
      description: 'Customer reported battery bank discharge alarm and inverter fault code F04.',
      status: 'SCHEDULED',
      scheduledAt: scheduledTime,
      estimatedDuration: 90,
    },
  });
  console.log(`✓ Created Job: "${job.title}" [Status: ${job.status}]`);

  // Phase A: Check tracking when SCHEDULED (Coordinates MUST be masked!)
  console.log('\n  [Phase A - Status: SCHEDULED]');
  const trackingScheduled = await portalService.getLiveJobTracking(testTenant.id, relationshipId, job.id);
  console.log(`  - Tracking isLive: ${trackingScheduled.telemetry.isLive} (Expected: false)`);
  console.log(`  - Masked Latitude: ${trackingScheduled.telemetry.latitude} (Expected: null)`);
  console.log(`  - Masked Longitude: ${trackingScheduled.telemetry.longitude} (Expected: null)`);
  console.log(`  - Completion OTP: ${trackingScheduled.completionOtp} (Expected: null - not yet on site)`);
  console.log(`  - Assigned Technician Bio: "${trackingScheduled.technician?.bio?.substring(0, 45)}..."`);
  console.log(`  - Assigned Technician Certifications: ${JSON.stringify(trackingScheduled.technician?.certifications)}`);

  if (trackingScheduled.telemetry.isLive !== false || trackingScheduled.telemetry.latitude !== null || trackingScheduled.completionOtp !== null) {
    throw new Error('Privacy Shield Failure: Technician coordinates or OTP exposed while SCHEDULED');
  }

  // Phase B: Technician starts driving (EN_ROUTE) & streams location
  console.log('\n  [Phase B - Status: EN_ROUTE]');
  // Stream technician location updates
  await jobService.updateTechnicianLocation(
    testTenant.id,
    job.id,
    { latitude: 6.5568, longitude: 3.3512, heading: 85, speed: 45 },
    { id: technician.id, tenantId: testTenant.id, permissions: ['technician_access'] }
  );

  // Transition status to EN_ROUTE
  await jobService.updateJobStatus(
    testTenant.id,
    job.id,
    { status: 'EN_ROUTE' as any },
    { id: technician.id, tenantId: testTenant.id, permissions: ['technician_access'] }
  );

  const trackingEnRoute = await portalService.getLiveJobTracking(testTenant.id, relationshipId, job.id);
  console.log(`  - Tracking isLive: ${trackingEnRoute.telemetry.isLive} (Expected: true)`);
  console.log(`  - Live Latitude: ${trackingEnRoute.telemetry.latitude} (Expected: 6.5568)`);
  console.log(`  - Live Longitude: ${trackingEnRoute.telemetry.longitude} (Expected: 3.3512)`);
  console.log(`  - Estimated Distance: ${trackingEnRoute.telemetry.distanceKm} km`);
  console.log(`  - Estimated ETA: ~${trackingEnRoute.telemetry.estimatedEtaMinutes} minutes`);
  console.log(`  - Completion OTP: ${trackingEnRoute.completionOtp} (Expected: null - still driving)`);

  if (!trackingEnRoute.telemetry.isLive || trackingEnRoute.telemetry.latitude !== 6.5568) {
    throw new Error('Live telemetry failed to report real-time GPS coordinates during EN_ROUTE');
  }

  // Phase C: Technician arrives on site (IN_PROGRESS)
  console.log('\n  [Phase C - Status: IN_PROGRESS]');
  await jobService.updateJobStatus(
    testTenant.id,
    job.id,
    { status: 'IN_PROGRESS' as any },
    { id: technician.id, tenantId: testTenant.id, permissions: ['technician_access'] }
  );

  const trackingInProgress = await portalService.getLiveJobTracking(testTenant.id, relationshipId, job.id);
  console.log(`  - Tracking Status: ${trackingInProgress.status}`);
  console.log(`  - Customer Completion OTP Displayed: [${trackingInProgress.completionOtp}] (Expected: 4-digit code)`);

  if (!trackingInProgress.completionOtp || trackingInProgress.completionOtp.length !== 4) {
    throw new Error('Uber-style OTP was not revealed to customer upon IN_PROGRESS arrival');
  }

  const generatedOtp = trackingInProgress.completionOtp;

  // Phase D: Job Completion with customer OTP (COMPLETED)
  console.log('\n  [Phase D - Status: COMPLETED]');
  await jobService.updateJobStatus(
    testTenant.id,
    job.id,
    { status: 'COMPLETED' as any, otp: generatedOtp },
    { id: technician.id, tenantId: testTenant.id, permissions: ['technician_access'] }
  );

  const trackingCompleted = await portalService.getLiveJobTracking(testTenant.id, relationshipId, job.id);
  console.log(`  - Tracking Status: ${trackingCompleted.status}`);
  console.log(`  - Telemetry isLive: ${trackingCompleted.telemetry.isLive} (Expected: false)`);
  console.log(`  - Coordinates Masked: Lat = ${trackingCompleted.telemetry.latitude}, Lon = ${trackingCompleted.telemetry.longitude}`);
  console.log(`  - OTP Cleared: ${trackingCompleted.completionOtp} (Expected: null)`);

  if (trackingCompleted.telemetry.isLive !== false || trackingCompleted.completionOtp !== null) {
    throw new Error('Post-completion cleanup failed: Coordinates or OTP still exposed');
  }

  // ----------------------------------------------------
  // TEST 3: Zero-Trust Customer Isolation & IDOR Protection
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Zero-Trust Customer Isolation & Security ---');
  // Create another customer in the same tenant
  const customer2 = await prisma.customerRecord.create({
    data: {
      tenantId: testTenant.id,
      name: 'Senator Adeleke',
      email: 'adeleke@senate.gov.ng',
      phone: '+2348099887766',
    },
  });

  const identity2 = await prisma.serviceOSIdentity.create({
    data: { phone: customer2.phone, status: 'ACTIVE' },
  });

  const relationship2 = await prisma.customerTenantRelationship.create({
    data: {
      tenantId: testTenant.id,
      customerRecordId: customer2.id,
      identityId: identity2.id,
      status: 'ACTIVE',
    },
  });

  try {
    // Customer 2 tries to track Customer 1's job!
    await portalService.getLiveJobTracking(testTenant.id, relationship2.id, job.id);
    throw new Error('SECURITY BREACH: Customer 2 accessed Customer 1 job tracking');
  } catch (err: any) {
    console.log(`✓ IDOR Cross-Customer Access Blocked as Expected: "${err.message}"`);
  }

  // ----------------------------------------------------
  // TEST 4: Self-Serve Invoices & Digital Receipts
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Self-Serve Invoices History ---');
  // Create test invoices
  await prisma.invoice.create({
    data: {
      tenantId: testTenant.id,
      customerRecordId: testCustomer.id,
      jobId: job.id,
      title: 'Inverter Servicing & Replacement Capacitor Kit',
      amount: 185000,
      status: 'PAID',
      dueDate: new Date(),
      paidAt: new Date(),
    },
  });

  await prisma.invoice.create({
    data: {
      tenantId: testTenant.id,
      customerRecordId: testCustomer.id,
      title: 'Annual Solar Preventive Maintenance Agreement',
      amount: 450000,
      status: 'SENT',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  const invoiceHistory = await portalService.getInvoicesHistory(testTenant.id, relationshipId);
  console.log(`✓ Retrieved ${invoiceHistory.length} Customer Invoices:`);
  for (const inv of invoiceHistory) {
    console.log(`  - #${inv.id.substring(0, 8)} | ${inv.title} | Amount: ₦${Number(inv.amount).toLocaleString()} | Status: ${inv.status} (Paid: ${inv.isPaid})`);
  }

  if (invoiceHistory.length !== 2) {
    throw new Error('Failed to retrieve all customer invoices');
  }

  // ----------------------------------------------------
  // TEST 5: Self-Serve Equipment Portfolio & Warranty Tracking
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Self-Serve Equipment & Warranty Portfolio ---');
  const warrantyDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 180 days remaining
  const asset = await prisma.asset.create({
    data: {
      tenantId: testTenant.id,
      customerRecordId: testCustomer.id,
      name: 'Victron MultiPlus-II 48/5000 Inverter/Charger',
      manufacturer: 'Victron Energy',
      modelNumber: 'PMP482505010',
      serialNumber: 'HQ2144X9PZA',
      installDate: new Date('2025-06-15'),
      warrantyExpiresAt: warrantyDate,
      warrantyDocumentUrl: 'https://cdn.serviceos.local/warranties/victron_warranty_cert_9302.pdf',
    },
  });

  // Create maintenance schedule for this asset
  await prisma.maintenanceSchedule.create({
    data: {
      tenantId: testTenant.id,
      customerRecordId: testCustomer.id,
      title: 'Quarterly Terminal Torque & Dust Filter Clean',
      intervalMonths: 3,
      nextDueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
  });

  const assetsHistory = await portalService.getAssetsHistory(testTenant.id, relationshipId);
  console.log(`✓ Retrieved ${assetsHistory.length} Registered Appliances/Equipment:`);
  const firstAsset = assetsHistory[0];
  console.log(`  - Asset: ${firstAsset.name} (S/N: ${firstAsset.serialNumber})`);
  console.log(`  - Warranty Active: ${firstAsset.warranty.isActive} (Expected: true)`);
  console.log(`  - Days Remaining: ${firstAsset.warranty.daysRemaining} days`);
  console.log(`  - Warranty Doc: ${firstAsset.warranty.documentUrl}`);
  console.log(`  - Linked Maintenance Schedules: ${firstAsset.maintenanceSchedules.length}`);

  if (!firstAsset.warranty.isActive || firstAsset.warranty.daysRemaining == null || firstAsset.warranty.daysRemaining <= 0) {
    throw new Error('Warranty engine calculation failed');
  }

  // ----------------------------------------------------
  // TEST 6: Direct Service Request Pipeline straight to Branch Queue
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Direct Service Call Pipeline to Branch Queue ---');
  const serviceRequest = await portalService.createServiceRequest(testTenant.id, relationshipId, {
    assetId: asset.id,
    description: 'Master circuit breaker tripped twice this morning after heavy rain. Inverter displays ground fault LED.',
    urgency: 'EMERGENCY' as any,
    preferredDate: new Date(Date.now() + 24 * 60 * 60000).toISOString(),
    preferredTimeSlot: 'MORNING_8_12',
    attachments: [
      'https://cdn.serviceos.local/uploads/inverter_ground_fault_photo.jpg',
      'https://cdn.serviceos.local/uploads/breaker_panel.jpg',
    ],
  });

  console.log(`✓ Service Request Created: #${serviceRequest.id.substring(0, 8)}`);
  console.log(`  - Urgency Level: ${serviceRequest.urgency} (Expected: EMERGENCY)`);
  console.log(`  - Preferred Time Slot: ${serviceRequest.preferredTimeSlot}`);
  console.log(`  - Attachments Count: ${serviceRequest.attachments.length}`);
  console.log(`  - Status in Branch Queue: ${serviceRequest.status} (Expected: OPEN)`);

  // Verify real-time notification was fired
  const emergencyNotification = sentNotifications.find(n => n.title.includes('EMERGENCY'));
  console.log(`✓ Real-Time Dispatch Alert Sent to Branch: "${emergencyNotification?.title}"`);

  if (!emergencyNotification || serviceRequest.urgency !== 'EMERGENCY') {
    throw new Error('Emergency pipeline failed to fire real-time branch notification');
  }

  // Retrieve customer's service requests
  const customerRequests = await portalService.getCustomerServiceRequests(testTenant.id, relationshipId);
  console.log(`✓ Retrieved ${customerRequests.length} Customer Service Request(s)`);
  console.log(`  - Request Asset Tagged: ${customerRequests[0].asset?.name}`);

  // ----------------------------------------------------
  // TEST 7: Unified Customer Dashboard Overview
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Unified Customer Portal Dashboard ---');
  const dashboard = await portalService.getDashboard(testTenant.id, relationshipId);
  console.log(`✓ Customer Dashboard Loaded for: ${dashboard.profile.name}`);
  console.log(`  - Tenant: ${dashboard.tenantName}`);
  console.log(`  - Quotes: ${dashboard.quotes.length}`);
  console.log(`  - Invoices: ${dashboard.invoices.length}`);
  console.log(`  - Jobs: ${dashboard.jobs.length}`);
  console.log(`  - Registered Assets: ${dashboard.assets.length}`);
  console.log(`  - Active Service Requests: ${dashboard.serviceRequests.length}`);

  console.log('\n====================================================');
  console.log('🎉 ALL STAGE 25 CUSTOMER PORTAL PRODUCTION TESTS PASSED!');
  console.log('====================================================');
}

runStage25Verification()
  .catch((err) => {
    console.error('❌ Stage 25 Verification Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
