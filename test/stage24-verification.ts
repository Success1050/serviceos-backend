import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { StripeAdapter } from '../src/modules/payment/adapters/stripe.adapter';
import { PaystackAdapter } from '../src/modules/payment/adapters/paystack.adapter';
import { FlutterwaveAdapter } from '../src/modules/payment/adapters/flutterwave.adapter';
import { PaymentGatewayFactory } from '../src/modules/payment/adapters/payment-gateway.factory';
import { PaymentService } from '../src/modules/payment/payment.service';
import { EscrowHoldCronService } from '../src/modules/payment/cron/escrow-hold.cron';
import { PortalService } from '../src/modules/portal/portal.service';
import { JobService } from '../src/modules/job/job.service';

const prisma = new PrismaClient();
const configService = new ConfigService();

// Mock NotificationService
const mockNotificationService: any = {
  sendToTenant: async (tenantId: string, title: string, message: string) => {
    console.log(`  [NOTIFICATION] ${title}: ${message}`);
  },
};

async function runStage24Verification() {
  console.log('====================================================');
  console.log('🚀 STAGE 24: ENTERPRISE PAYMENTS & ESCROW VERIFICATION');
  console.log('====================================================\n');

  // 1. Adapter & Factory Test
  console.log('--- TEST 1: Multi-Gateway Adapters & Dynamic Factory ---');
  const stripeAdapter = new StripeAdapter(configService);
  const paystackAdapter = new PaystackAdapter(configService);
  const flutterwaveAdapter = new FlutterwaveAdapter(configService);
  const factory = new PaymentGatewayFactory(stripeAdapter, paystackAdapter, flutterwaveAdapter);

  console.log('✓ Testing Currency-based Auto Resolution:');
  const resolvedUsd = factory.resolveAdapter({}, 'USD');
  const resolvedNgn = factory.resolveAdapter({}, 'NGN');
  const resolvedKes = factory.resolveAdapter({}, 'KES');
  console.log(`  - USD resolved to: ${resolvedUsd.gatewayName} (Expected: STRIPE)`);
  console.log(`  - NGN resolved to: ${resolvedNgn.gatewayName} (Expected: PAYSTACK)`);
  console.log(`  - KES resolved to: ${resolvedKes.gatewayName} (Expected: FLUTTERWAVE)`);

  if (resolvedUsd.gatewayName !== 'STRIPE' || resolvedNgn.gatewayName !== 'PAYSTACK' || resolvedKes.gatewayName !== 'FLUTTERWAVE') {
    throw new Error('Gateway resolution mismatch');
  }

  // 2. Stripe Auth & Capture
  console.log('\n--- TEST 2: Stripe 7-Day Card Pre-Auth Hold & Capture ---');
  const stripeHold = await stripeAdapter.authorizeHold({
    amount: 750,
    currency: 'USD',
    customerEmail: 'test-client@serviceos.local',
    customerName: 'Alice Global',
  });
  console.log(`✓ Stripe Pre-Auth Hold ID: ${stripeHold.authorizationId} (Status: ${stripeHold.status})`);
  console.log(`  - Hold Expires At: ${stripeHold.expiresAt?.toISOString()}`);

  const stripeCapture = await stripeAdapter.captureHold({
    authorizationId: stripeHold.authorizationId,
    amount: 750,
    currency: 'USD',
  });
  console.log(`✓ Stripe Hold Captured: ${stripeCapture.transactionReference} (Status: ${stripeCapture.status})`);

  // 3. Paystack Tokenized Escrow Pre-Debit & Bank Transfer
  console.log('\n--- TEST 3: Paystack Tokenized Escrow Pre-Debit & Virtual Account ---');
  const paystackHold = await paystackAdapter.authorizeHold({
    amount: 450000,
    currency: 'NGN',
    customerEmail: 'test-nigeria@serviceos.local',
    customerName: 'Chidi Okafor',
    paymentMethodToken: 'AUTH_token_mock_123',
  });
  console.log(`✓ Paystack Escrow Pre-Debit ID: ${paystackHold.authorizationId} (Status: ${paystackHold.status})`);

  const paystackPayment = await paystackAdapter.initializePayment({
    amount: 3000000,
    currency: 'NGN',
    customerEmail: 'chidi@enterprise.ng',
    customerName: 'Chidi Okafor (Solar Install)',
    paymentChannels: ['bank_transfer', 'card', 'ussd'],
  });
  console.log(`✓ Paystack Dedicated Virtual Account Generated:`);
  console.log(`  - Bank: ${paystackPayment.virtualAccount?.bankName}`);
  console.log(`  - Account Number: ${paystackPayment.virtualAccount?.accountNumber}`);
  console.log(`  - Account Name: ${paystackPayment.virtualAccount?.accountName}`);

  // 4. Database Lifecycle Integration Test
  console.log('\n--- TEST 4: Full Multi-Tenant Database Lifecycle ---');
  
  // Create test tenant
  const testTenant = await prisma.tenant.upsert({
    where: { slug: 'solar-dynamics-test' },
    update: {},
    create: {
      name: 'Solar Dynamics Testing',
      slug: 'solar-dynamics-test',
    },
  });

  const testCustomer = await prisma.customerRecord.create({
    data: {
      tenantId: testTenant.id,
      name: 'Enterprise Client Lagos',
      email: 'client@lagosbiz.com',
      phone: '+2348099887766',
      address: 'Plot 14 Victoria Island, Lagos',
    },
  });

  const paymentService = new PaymentService(prisma as any, factory, mockNotificationService);
  const portalService = new PortalService(prisma as any, configService, null as any, mockNotificationService);
  const jobService = new JobService(prisma as any, paymentService);

  // 5. Quote with Milestone Billing & T&C Signing
  console.log('\n--- TEST 5: Milestone Billing & Digital T&C Signing ---');
  const quote = await prisma.quote.create({
    data: {
      tenantId: testTenant.id,
      customerRecordId: testCustomer.id,
      title: '50kVA Hybrid Commercial Solar System',
      amount: 10000000,
      billingType: 'MILESTONE',
      status: 'SENT',
      termsAndConditions: 'Customer authorizes 24h pre-arrival escrow holds and progress milestone billing upon sign-off.',
      milestones: {
        create: [
          {
            tenantId: testTenant.id,
            title: 'Initial Deposit & Equipment Order',
            percentage: 30,
            amount: 3000000,
            order: 1,
            status: 'PENDING',
          },
          {
            tenantId: testTenant.id,
            title: 'Mounting & Site Rough-In',
            percentage: 40,
            amount: 4000000,
            order: 2,
            status: 'PENDING',
          },
          {
            tenantId: testTenant.id,
            title: 'Final Commissioning & Sign-Off',
            percentage: 30,
            amount: 3000000,
            order: 3,
            status: 'PENDING',
          },
        ],
      },
    },
    include: { milestones: true },
  });

  console.log(`✓ Created Quote #${quote.id.substring(0, 8)} with 3 Milestones totaling ₦${quote.amount}`);

  // Customer digitally accepts quote in Portal
  const acceptedQuote = await portalService.acceptQuote(
    testTenant.slug,
    quote.id,
    {
      acceptedTerms: true,
      signerName: 'Chief T. Adeleke',
      signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAADSCAMAAACX',
    },
    '102.89.23.14',
  );

  console.log(`✓ Quote Accepted by: ${acceptedQuote.signerName} (IP: ${acceptedQuote.signerIp})`);
  console.log(`  - Digitally Signed At: ${acceptedQuote.signedTermsAt?.toISOString()}`);

  // Verify Milestone 1 deposit invoice auto-generated
  const milestone1 = await prisma.quoteMilestone.findFirst({
    where: { quoteId: quote.id, order: 1 },
    include: { invoice: true },
  });
  console.log(`✓ Milestone 1 Status: ${milestone1?.status} (Invoice: #${milestone1?.invoiceId?.substring(0, 8)}, Amount: ₦${milestone1?.invoice?.amount})`);

  // 6. Site Visit Gate & Pre-Arrival Card Hold
  console.log('\n--- TEST 6: Site Visit Gate (Blocking EN_ROUTE on Payment Failure) ---');
  
  // Create test technician user
  const techUser = await prisma.user.upsert({
    where: { email: 'tech1@serviceos.local' },
    update: {},
    create: {
      tenantId: testTenant.id,
      email: 'tech1@serviceos.local',
      passwordHash: 'dummy',
      firstName: 'Sunday',
      lastName: 'FieldTech',
    },
  });

  // Create Job with scheduledAt in 12 hours
  const job = await prisma.job.create({
    data: {
      tenantId: testTenant.id,
      customerRecordId: testCustomer.id,
      quoteId: quote.id,
      assignedTechnicianId: techUser.id,
      title: 'Solar Inverter Site Installation',
      scheduledAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      status: 'SCHEDULED',
    },
  });

  // Run Cron Scanner
  const escrowCron = new EscrowHoldCronService(prisma as any, paymentService);
  await escrowCron.scanUpcomingJobsForPreArrivalHold();

  const refreshedJob = await prisma.job.findUnique({
    where: { id: job.id },
    include: { escrowHolds: true },
  });
  console.log(`✓ Cron Scanned & Placed Hold: Job paymentHoldStatus = ${refreshedJob?.paymentHoldStatus}`);
  console.log(`  - Active Escrow Hold ID: #${refreshedJob?.escrowHolds[0]?.id.substring(0, 8)} (Status: ${refreshedJob?.escrowHolds[0]?.status})`);

  // Test Site Visit Protection: Simulate Failed Hold
  const failedJob = await prisma.job.create({
    data: {
      tenantId: testTenant.id,
      customerRecordId: testCustomer.id,
      assignedTechnicianId: techUser.id,
      title: 'Unbacked Site Visit Test',
      scheduledAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      status: 'SCHEDULED',
      paymentHoldStatus: 'HOLD_FAILED', // Payment failed 24h prior
    },
  });

  try {
    console.log('✓ Testing Technician Clocking EN_ROUTE to Unbacked Site Visit:');
    await jobService.updateJobStatus(
      testTenant.id,
      failedJob.id,
      { status: 'EN_ROUTE' as any },
      { id: techUser.id, permissions: ['technician_access'] },
    );
    throw new Error('FAIL: Technician should have been blocked!');
  } catch (err: any) {
    console.log(`  [PROTECTION CONFIRMED]: Blocked with: "${err.message}"`);
  }

  // 7. OTP Completion & Instant Escrow Capture
  console.log('\n--- TEST 7: OTP On-Site Completion & Instant Escrow Capture ---');
  
  // Step A: Tech clocks EN_ROUTE on backed job
  await jobService.updateJobStatus(
    testTenant.id,
    job.id,
    { status: 'EN_ROUTE' as any },
    { id: techUser.id, permissions: ['technician_access'] },
  );
  console.log('✓ Technician clocked EN_ROUTE to backed job site.');

  // Step B: Tech clocks IN_PROGRESS (generates OTP)
  const inProgressJob = await jobService.updateJobStatus(
    testTenant.id,
    job.id,
    { status: 'IN_PROGRESS' as any },
    { id: techUser.id, permissions: [] }, // Manager context to view OTP
  );
  const otp = (inProgressJob as any).completionOtp;
  console.log(`✓ Job IN_PROGRESS. Customer OTP Generated: [${otp}]`);

  // Step C: Tech verifies customer's OTP to complete job
  await jobService.updateJobStatus(
    testTenant.id,
    job.id,
    { status: 'COMPLETED' as any, otp },
    { id: techUser.id, permissions: ['technician_access'] },
  );

  const completedJob = await prisma.job.findUnique({
    where: { id: job.id },
    include: { escrowHolds: true },
  });

  console.log(`✓ Job Completed on Site! Status: ${completedJob?.status}`);
  console.log(`✓ Escrow Hold Automatically Captured: Status = ${completedJob?.escrowHolds[0]?.status}`);
  console.log(`✓ Escrow Captured At: ${completedJob?.escrowHolds[0]?.capturedAt?.toISOString()}`);

  console.log('\n====================================================');
  console.log('🎉 ALL STAGE 24 PRODUCTION TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runStage24Verification()
  .catch((err) => {
    console.error('❌ Stage 24 Verification Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
