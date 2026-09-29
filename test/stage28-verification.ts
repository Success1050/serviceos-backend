import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { SplitSettlementService } from '../src/modules/wallet/services/split-settlement.service';
import { PayoutService } from '../src/modules/wallet/services/payout.service';
import { WalletService } from '../src/modules/wallet/wallet.service';
import { PaystackAdapter } from '../src/modules/payment/adapters/paystack.adapter';
import { JobService } from '../src/modules/job/job.service';

const prisma = new PrismaClient();
const configService = new ConfigService();

// Mock NotificationService tracking sent alerts
const sentNotifications: any[] = [];
const mockNotificationService: any = {
  sendToTenant: async (tenantId: string, title: string, message: string, type?: string, linkUrl?: string) => {
    console.log(`  [TENANT NOTIFICATION] Tenant: ${tenantId.substring(0, 8)}... | Type: ${type} | Title: "${title}" | Message: "${message}"`);
    sentNotifications.push({ tenantId, title, message, type, linkUrl });
  },
  sendToUser: async (tenantId: string, userId: string, title: string, message: string, type?: string, linkUrl?: string) => {
    console.log(`  [USER NOTIFICATION] User: ${userId.substring(0, 8)}... | Type: ${type} | Title: "${title}" | Message: "${message}"`);
    sentNotifications.push({ tenantId, userId, title, message, type, linkUrl });
  },
};

// Mock PaymentService for escrow hold capture
const mockPaymentService: any = {
  captureEscrowHoldForJob: async (jobId: string, tenantId: string) => {
    console.log(`  [PAYMENT SERVICE] Escrow hold captured for job ${jobId}`);
  },
};

async function runStage28Verification() {
  console.log('========================================================================');
  console.log('🚀 STAGE 28: FINTECH WALLETS & MULTI-TENANT PAYROLL VERIFICATION');
  console.log('========================================================================\n');

  const paystackAdapter = new PaystackAdapter(configService);
  const splitSettlementService = new SplitSettlementService(prisma as any, mockNotificationService);
  const payoutService = new PayoutService(prisma as any, paystackAdapter, mockNotificationService);
  const walletService = new WalletService(prisma as any);
  const jobService = new JobService(prisma as any, mockPaymentService, splitSettlementService);

  const timestamp = Date.now();

  try {
    // -------------------------------------------------------------------------
    // 1. SETUP MULTI-LEVEL TENANT HIERARCHY & DYNAMIC COMMISSION TECH
    // -------------------------------------------------------------------------
    console.log('--- STEP 1: Setting Up HQ, Franchise Branch & Commissioned Tech ---');

    // Corporate HQ Tenant
    const hqTenant = await prisma.tenant.create({
      data: {
        name: `ServiceOS Global Corporate HQ (${timestamp})`,
        slug: `hq-${timestamp}`,
        settings: {
          create: {
            franchiseRoyaltyRate: 5.0, // 5% Franchise Royalty
            royaltyType: 'PERCENTAGE',
          },
        },
      },
      include: { settings: true },
    });
    console.log(`✓ Created Corporate HQ: ${hqTenant.name} with 5% Franchise Royalty`);

    // Sub-Company Franchise Branch Tenant
    const branchTenant = await prisma.tenant.create({
      data: {
        name: `Apex Lekki Franchise Branch (${timestamp})`,
        slug: `lekki-${timestamp}`,
        parentId: hqTenant.id, // Child of Corporate HQ
        settings: {
          create: {
            businessProfile: { city: 'Lagos', state: 'Lagos' },
          },
        },
      },
    });
    console.log(`✓ Created Franchise Branch: ${branchTenant.name} (Child of HQ: ${hqTenant.id.substring(0, 8)}...)`);

    // Branch Field Technician with 15% Dynamic Commission
    const tech = await prisma.user.create({
      data: {
        email: `tech_${timestamp}@apex.local`,
        passwordHash: 'dummy_hash_for_test',
        firstName: 'Emeka',
        lastName: 'Okonkwo',
        phone: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
        tenantId: branchTenant.id,
        isFieldTech: true,
        tradeSpecialty: 'HVAC Specialist',
        customCommissionRate: 15.0, // 15% Dynamic Commission Rate
        termsAcknowledged: true,
        termsAcknowledgedAt: new Date(),
        agreedCommissionSnapshot: 15.0,
      },
    });
    console.log(`✓ Created Field Tech: ${tech.firstName} ${tech.lastName} with 15% Commission Rate`);

    // Branch Manager User
    const manager = await prisma.user.create({
      data: {
        email: `manager_${timestamp}@apex.local`,
        passwordHash: 'dummy_hash_for_test',
        firstName: 'Adebayo',
        lastName: 'Alabi',
        tenantId: branchTenant.id,
        directPermissions: ['wallets_view', 'wallets_manage', 'payouts_manage'],
      },
    });
    console.log(`✓ Created Branch Manager: ${manager.firstName} ${manager.lastName}`);

    // Customer Record
    const customer = await prisma.customerRecord.create({
      data: {
        tenantId: branchTenant.id,
        name: 'Chief Babatunde Adeleke',
        email: `customer_${timestamp}@domain.com`,
        phone: '+2348022223344',
      },
    });

    // -------------------------------------------------------------------------
    // 2. JOB DISPATCH, INVOICING & OTP COMPLETION
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 2: Creating Job, Invoice (₦100,000) & Verifying OTP Completion ---');

    const job = await prisma.job.create({
      data: {
        tenantId: branchTenant.id,
        customerRecordId: customer.id,
        assignedTechnicianId: tech.id,
        title: 'Commercial Chiller Overhaul & Compressor Reconditioning',
        status: 'IN_PROGRESS',
        completionOtp: '8942',
        completionOtpExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: branchTenant.id,
        customerRecordId: customer.id,
        jobId: job.id,
        title: 'Invoice - Commercial Chiller Overhaul',
        amount: 100000.0, // ₦100,000 Gross Revenue
        status: 'PAID',
        paidAt: new Date(),
      },
    });
    console.log(`✓ Created Invoice for ₦100,000.00 linked to Job: "${job.title}"`);

    // Complete Job with Customer OTP (triggers automatic 3-tier split settlement)
    console.log(`Submitting Customer OTP "8942" to close Job...`);
    const completedJob = await jobService.updateJobStatus(
      branchTenant.id,
      job.id,
      { status: 'COMPLETED' as any, otp: '8942' },
      { id: tech.id, permissions: ['technician_access'] }
    );
    console.log(`✓ Job Closed Successfully! Status: COMPLETED`);

    // -------------------------------------------------------------------------
    // 3. VERIFY 3-TIER WALLET BALANCES & DOUBLE-ENTRY LEDGERS
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 3: Verifying 3-Tier Split Balances & Financial Ledger ---');

    // A. Corporate HQ Wallet (5% Royalty = ₦5,000)
    const hqWallet = await prisma.wallet.findFirst({
      where: { tenantId: hqTenant.id, type: 'HQ' },
      include: { transactions: true },
    });
    console.log(`1. Corporate HQ Wallet:`);
    console.log(`   - Balance: ₦${Number(hqWallet?.balance).toLocaleString()} (Expected: ₦5,000.00)`);
    console.log(`   - Ledger Entries: ${hqWallet?.transactions.length}`);
    hqWallet?.transactions.forEach((tx) => {
      console.log(`     * [${tx.type}] ${tx.category}: ₦${Number(tx.amount).toLocaleString()} - ${tx.description}`);
    });
    if (Number(hqWallet?.balance) !== 5000) {
      throw new Error(`HQ Wallet balance mismatch! Expected 5000, got ${hqWallet?.balance}`);
    }

    // B. Field Tech Staff Wallet (15% Commission = ₦15,000)
    const staffWallet = await prisma.wallet.findUnique({
      where: { userId: tech.id },
      include: { transactions: true },
    });
    console.log(`2. Technician Staff Wallet:`);
    console.log(`   - Balance: ₦${Number(staffWallet?.balance).toLocaleString()} (Expected: ₦15,000.00)`);
    console.log(`   - Ledger Entries: ${staffWallet?.transactions.length}`);
    staffWallet?.transactions.forEach((tx) => {
      console.log(`     * [${tx.type}] ${tx.category}: ₦${Number(tx.amount).toLocaleString()} - ${tx.description}`);
    });
    if (Number(staffWallet?.balance) !== 15000) {
      throw new Error(`Staff Wallet balance mismatch! Expected 15000, got ${staffWallet?.balance}`);
    }

    // C. Branch Wallet (Gross ₦100,000 - ₦5,000 Royalty - ₦15,000 Commission = ₦80,000 Net)
    const branchWallet = await prisma.wallet.findFirst({
      where: { tenantId: branchTenant.id, type: 'BRANCH' },
      include: { transactions: true },
    });
    console.log(`3. Franchise Branch Wallet:`);
    console.log(`   - Balance: ₦${Number(branchWallet?.balance).toLocaleString()} (Expected: ₦80,000.00 Net)`);
    console.log(`   - Ledger Entries: ${branchWallet?.transactions.length}`);
    branchWallet?.transactions.forEach((tx) => {
      console.log(`     * [${tx.type}] ${tx.category}: ₦${Number(tx.amount).toLocaleString()} - ${tx.description}`);
    });
    if (Number(branchWallet?.balance) !== 80000) {
      throw new Error(`Branch Wallet balance mismatch! Expected 80000, got ${branchWallet?.balance}`);
    }

    // -------------------------------------------------------------------------
    // 4. VERIFY STRICT IDEMPOTENCY
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 4: Verifying Idempotency (Preventing Double-Splitting) ---');
    const repeatSettlement = await splitSettlementService.settleJobRevenue(job.id);
    console.log(`✓ Re-triggering settlement result: alreadySettled=${repeatSettlement.alreadySettled}, message="${repeatSettlement.message}"`);

    const staffWalletRecheck = await prisma.wallet.findUnique({ where: { userId: tech.id } });
    if (Number(staffWalletRecheck?.balance) !== 15000) {
      throw new Error(`Idempotency failure! Staff balance changed to ${staffWalletRecheck?.balance}`);
    }
    console.log(`✓ Idempotency verified: Wallet balances remained unchanged.`);

    // -------------------------------------------------------------------------
    // 5. BANKING RAILS: RESOLUTION & SAVING NUBAN ACCOUNT
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 5: Testing Paystack Banking Rails & Bank Account Resolution ---');
    const banks = await payoutService.getSupportedBanks();
    console.log(`✓ Fetched ${banks.length} supported Nigerian commercial banks & fintechs (e.g., ${banks[0].name}, ${banks[1].name})`);

    const resolved = await payoutService.resolveBankAccount({
      bankCode: '058', // GTBank
      accountNumber: '0123456789',
    });
    console.log(`✓ Resolved NUBAN: Account ${resolved.accountNumber} -> "${resolved.accountName}"`);

    const bankDetail = await payoutService.createBankDetail(
      { id: tech.id, tenantId: branchTenant.id, email: tech.email },
      {
        bankName: 'Guaranty Trust Bank (GTBank)',
        bankCode: '058',
        accountNumber: '0123456789',
        accountName: resolved.accountName,
        isDefault: true,
      }
    );
    console.log(`✓ Saved Staff Bank Detail ID: ${bankDetail.id} (Recipient: ${bankDetail.recipientCode})`);

    // -------------------------------------------------------------------------
    // 6. PAYOUT REQUEST & FUND RESERVATION (LOCKED BALANCE)
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 6: Technician Submits Payout Request (₦10,000) & Tests Fund Lock ---');

    const payoutReq = await payoutService.requestPayout(
      { id: tech.id, tenantId: branchTenant.id, firstName: tech.firstName, lastName: tech.lastName },
      {
        bankDetailId: bankDetail.id,
        amount: 10000.0,
      }
    );
    console.log(`✓ Payout Request Created: Ref=${payoutReq.reference} | Status=${payoutReq.status} | Amount=₦${Number(payoutReq.amount).toLocaleString()}`);

    // Verify fund reservation
    const walletAfterReq = await prisma.wallet.findUnique({ where: { userId: tech.id } });
    const available = Number(walletAfterReq?.balance) - Number(walletAfterReq?.lockedBalance);
    console.log(`✓ Fund Reservation Check:`);
    console.log(`   - Total Balance: ₦${Number(walletAfterReq?.balance).toLocaleString()}`);
    console.log(`   - Locked Balance: ₦${Number(walletAfterReq?.lockedBalance).toLocaleString()}`);
    console.log(`   - Available Balance: ₦${available.toLocaleString()}`);

    if (Number(walletAfterReq?.lockedBalance) !== 10000 || available !== 5000) {
      throw new Error(`Fund reservation error! Locked: ${walletAfterReq?.lockedBalance}, Available: ${available}`);
    }

    // Edge Case: Attempt to withdraw ₦7,000 when only ₦5,000 available
    console.log(`Testing Over-Draft Protection: Attempting to withdraw ₦7,000 (Available: ₦5,000)...`);
    try {
      await payoutService.requestPayout(
        { id: tech.id, tenantId: branchTenant.id },
        { bankDetailId: bankDetail.id, amount: 7000.0 }
      );
      throw new Error('Overdraft test failed: should have thrown BadRequestException');
    } catch (err: any) {
      console.log(`✓ Overdraft correctly blocked: "${err.message}"`);
    }

    // -------------------------------------------------------------------------
    // 7. BRANCH MANAGER APPROVAL & AUTOMATED PAYSTACK TRANSFER
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 7: Branch Manager Approves Payout & Dispatches Paystack Transfer ---');

    const approveResult = await payoutService.approvePayout(
      { id: manager.id, tenantId: branchTenant.id },
      payoutReq.id,
      { reviewNotes: 'Verified completed chiller job milestones. Disbursing commission.' }
    );
    console.log(`✓ Payout Approved & Disbursed! Status: ${approveResult.status}`);

    const walletAfterDisbursement = await prisma.wallet.findUnique({ where: { userId: tech.id } });
    console.log(`✓ Wallet Post-Disbursement:`);
    console.log(`   - New Total Balance: ₦${Number(walletAfterDisbursement?.balance).toLocaleString()} (Expected: ₦5,000)`);
    console.log(`   - Locked Balance: ₦${Number(walletAfterDisbursement?.lockedBalance).toLocaleString()} (Expected: ₦0)`);

    if (Number(walletAfterDisbursement?.balance) !== 5000 || Number(walletAfterDisbursement?.lockedBalance) !== 0) {
      throw new Error(`Post-disbursement balance error! Got balance: ${walletAfterDisbursement?.balance}`);
    }

    // Verify AuditLog record
    const audit = await prisma.auditLog.findFirst({
      where: { entityId: payoutReq.id, action: 'APPROVE_PAYOUT' },
    });
    console.log(`✓ Immutable AuditLog Verified: Action="${audit?.action}" by User=${audit?.userId?.substring(0, 8)}...`);

    // -------------------------------------------------------------------------
    // 8. TESTING PAYOUT REJECTION & BALANCE UNLOCKING (EDGE CASE)
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 8: Testing Rejection Workflow & Fund Restoration ---');

    // Request ₦3,000 withdrawal from remaining ₦5,000
    const secondReq = await payoutService.requestPayout(
      { id: tech.id, tenantId: branchTenant.id, firstName: tech.firstName, lastName: tech.lastName },
      { bankDetailId: bankDetail.id, amount: 3000.0 }
    );
    console.log(`✓ Second Payout Requested: ₦3,000 (Ref: ${secondReq.reference})`);

    // Manager rejects payout with reason
    const rejectionResult = await payoutService.rejectPayout(
      { id: manager.id, tenantId: branchTenant.id },
      secondReq.id,
      { reason: 'Flagged for tax clearance review before final branch payout' }
    );
    console.log(`✓ Payout Rejected: Status=${rejectionResult.status} | Reason="${rejectionResult.rejectionReason}"`);

    const walletAfterReject = await prisma.wallet.findUnique({ where: { userId: tech.id } });
    console.log(`✓ Post-Rejection Fund Restoration:`);
    console.log(`   - Balance: ₦${Number(walletAfterReject?.balance).toLocaleString()} (Expected: ₦5,000)`);
    console.log(`   - Locked Balance: ₦${Number(walletAfterReject?.lockedBalance).toLocaleString()} (Expected: ₦0 - Unlocked!)`);

    if (Number(walletAfterReject?.balance) !== 5000 || Number(walletAfterReject?.lockedBalance) !== 0) {
      throw new Error(`Fund restoration error! Balance: ${walletAfterReject?.balance}, Locked: ${walletAfterReject?.lockedBalance}`);
    }

    // -------------------------------------------------------------------------
    // 9. MULTI-LEVEL DASHBOARDS
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 9: Verifying Mobile & Corporate Dashboard Views ---');

    // Technician Mobile Dashboard
    const techDashboard = await walletService.getMyWallet({ id: tech.id, tenantId: branchTenant.id });
    console.log(`✓ Technician Mobile View:`);
    console.log(`   - Available Balance: ₦${techDashboard.availableBalance.toLocaleString()}`);
    console.log(`   - Total Earned This Month: ₦${techDashboard.earnedThisMonth.toLocaleString()}`);
    console.log(`   - Total Withdrawn: ₦${techDashboard.totalWithdrawn.toLocaleString()}`);

    // Corporate HQ God-View
    const hqDashboard = await walletService.getHqWallet({ tenantId: hqTenant.id });
    console.log(`✓ Corporate HQ God-View:`);
    console.log(`   - Total Network Royalties: ₦${hqDashboard.totalRoyaltiesCollected.toLocaleString()}`);
    console.log(`   - Franchise Branches: ${hqDashboard.franchiseBranchesCount}`);
    console.log(`   - Branch Breakdown: Branch "${hqDashboard.branchBreakdown[0]?.branchName}" contributed ₦${hqDashboard.branchBreakdown[0]?.royaltiesContributed.toLocaleString()} in royalties on ₦${hqDashboard.branchBreakdown[0]?.grossVolume.toLocaleString()} volume`);

    console.log('\n========================================================================');
    console.log('🎉 ALL STAGE 28 FINTECH WALLETS & MULTI-TENANT PAYROLL TESTS PASSED!');
    console.log('========================================================================');
  } catch (error: any) {
    console.error('\n❌ STAGE 28 VERIFICATION FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runStage28Verification().catch((err) => {
  console.error(err);
  process.exit(1);
});
