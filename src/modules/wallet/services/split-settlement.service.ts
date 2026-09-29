import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { SettleJobDto } from '../dto/settle-job.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SplitSettlementService {
  private readonly logger = new Logger(SplitSettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Stage 28: Automated 3-Tier Split Settlement for a Completed Job
   * Splits gross job revenue between:
   * 1. Corporate HQ Wallet (Franchise Royalties via parent-child relationship)
   * 2. Branch Wallet (Local Job Operating Profit)
   * 3. Staff Wallet (Technician Commission)
   */
  async settleJobRevenue(jobId: string, dto?: SettleJobDto) {
    this.logger.log(`Initiating 3-tier split settlement for Job: ${jobId}`);

    // 1. Fetch Job with all relevant relations
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        tenant: {
          include: {
            settings: true,
            parent: {
              include: { settings: true },
            },
          },
        },
        assignedTechnician: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
        escrowHolds: {
          where: { status: 'CAPTURED' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    // 2. Idempotency Check: Prevent duplicate settlement
    if (job.splitSettled) {
      this.logger.warn(`Job ${jobId} was already split-settled at ${job.splitSettledAt?.toISOString()}. Skipping.`);
      return {
        success: true,
        alreadySettled: true,
        message: 'Job revenue has already been settled across wallets',
        jobId: job.id,
      };
    }

    // Secondary check against ledger to guarantee idempotency
    const existingTx = await this.prisma.walletTransaction.findFirst({
      where: {
        jobId: job.id,
        category: 'JOB_SETTLEMENT',
      },
    });

    if (existingTx) {
      await this.prisma.job.update({
        where: { id: job.id },
        data: { splitSettled: true, splitSettledAt: existingTx.createdAt },
      });
      return {
        success: true,
        alreadySettled: true,
        message: 'Job revenue ledger entries exist, marked settled',
        jobId: job.id,
      };
    }

    // 3. Determine Gross Amount & Currency
    let grossAmount = 0;
    let currency = 'NGN';

    if (dto?.forcedGrossAmount && dto.forcedGrossAmount > 0) {
      grossAmount = Number(dto.forcedGrossAmount);
    } else if (job.invoices.length > 0) {
      const paidInvoice = job.invoices.find((i) => i.status === 'PAID') || job.invoices[0];
      grossAmount = Number(paidInvoice.amount);
    } else if (job.escrowHolds.length > 0) {
      grossAmount = Number(job.escrowHolds[0].amount);
      currency = job.escrowHolds[0].currency || 'NGN';
    }

    if (grossAmount <= 0) {
      this.logger.warn(`Job ${jobId} has no invoice or escrow amount to settle. Gross: ${grossAmount}`);
      return {
        success: false,
        reason: 'Job has zero billable amount. Settlement deferred.',
        jobId: job.id,
      };
    }

    // 4. Calculate 3-Tier Splits
    const isSubCompany = !!job.tenant.parentId;
    const parentTenant = job.tenant.parent;

    // A. HQ Royalty (Only for Sub-Company branches under an HQ)
    let royaltyRate = 0;
    let royaltyAmount = 0;

    if (isSubCompany && parentTenant) {
      const hqSettings = parentTenant.settings;
      if (hqSettings?.franchiseRoyaltyRate) {
        royaltyRate = Number(hqSettings.franchiseRoyaltyRate);
      } else {
        // Fallback default: 5% royalty for franchise network
        royaltyRate = 5.0;
      }
      royaltyAmount = Math.round((grossAmount * (royaltyRate / 100)) * 100) / 100;
    }

    // B. Technician Commission (Dynamic Compensation)
    let commissionRate = 0;
    let commissionAmount = 0;
    const tech = job.assignedTechnician;

    if (tech) {
      if (dto?.overrideCommissionRate !== undefined) {
        commissionRate = Number(dto.overrideCommissionRate);
      } else if (tech.customCommissionRate) {
        commissionRate = Number(tech.customCommissionRate);
      } else if (tech.agreedCommissionSnapshot) {
        commissionRate = Number(tech.agreedCommissionSnapshot);
      } else {
        commissionRate = 10.0; // Standard baseline 10%
      }
      commissionAmount = Math.round((grossAmount * (commissionRate / 100)) * 100) / 100;
    }

    // C. Guard against over-allocation
    if (royaltyAmount + commissionAmount > grossAmount) {
      this.logger.warn(`Royalty (${royaltyAmount}) + Commission (${commissionAmount}) exceeds gross (${grossAmount}). Capping.`);
      const totalAllocated = royaltyAmount + commissionAmount;
      royaltyAmount = Math.round((royaltyAmount / totalAllocated) * grossAmount * 100) / 100;
      commissionAmount = Math.round((grossAmount - royaltyAmount) * 100) / 100;
    }

    // D. Branch Net Profit
    const branchNetAmount = Math.round((grossAmount - royaltyAmount - commissionAmount) * 100) / 100;

    this.logger.log(
      `Splits calculated for Job ${job.id}: Gross=${grossAmount} ${currency} | BranchNet=${branchNetAmount} | HQRoyalty=${royaltyAmount} (${royaltyRate}%) | TechCommission=${commissionAmount} (${commissionRate}%)`
    );

    // 5. Execute Atomic Multi-Wallet Settlement Transaction
    const settlementResult = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const primaryInvoiceId = job.invoices[0]?.id || null;

      // 1. Get or Create Branch Wallet
      let branchWallet = await tx.wallet.findFirst({
        where: {
          tenantId: job.tenantId,
          type: 'BRANCH',
        },
      });

      if (!branchWallet) {
        branchWallet = await tx.wallet.create({
          data: {
            tenantId: job.tenantId,
            type: 'BRANCH',
            currency,
            balance: 0,
            ledgerBalance: 0,
            lockedBalance: 0,
            status: 'ACTIVE',
          },
        });
      }

      // Branch Wallet: Record Gross Settlement Credit
      const branchBalBefore = Number(branchWallet.balance);
      const branchGrossBal = branchBalBefore + grossAmount;

      await tx.walletTransaction.create({
        data: {
          walletId: branchWallet.id,
          type: 'CREDIT',
          category: 'JOB_SETTLEMENT',
          amount: grossAmount,
          balanceBefore: branchBalBefore,
          balanceAfter: branchGrossBal,
          reference: `wtx_gross_${job.id}_${Date.now()}`,
          description: `Gross settlement for Job: ${job.title}`,
          jobId: job.id,
          invoiceId: primaryInvoiceId,
          metadata: { grossAmount, currency },
        },
      });

      let currentBranchBal = branchGrossBal;

      // 2. Process HQ Royalty Split (if applicable)
      let hqWalletId: string | null = null;
      if (royaltyAmount > 0 && parentTenant) {
        // Get or Create HQ Wallet
        let hqWallet = await tx.wallet.findFirst({
          where: {
            tenantId: parentTenant.id,
            type: 'HQ',
          },
        });

        if (!hqWallet) {
          hqWallet = await tx.wallet.create({
            data: {
              tenantId: parentTenant.id,
              type: 'HQ',
              currency,
              balance: 0,
              ledgerBalance: 0,
              lockedBalance: 0,
              status: 'ACTIVE',
            },
          });
        }
        hqWalletId = hqWallet.id;

        // Debit Branch Wallet for HQ Royalty
        const branchAfterRoyalty = currentBranchBal - royaltyAmount;
        await tx.walletTransaction.create({
          data: {
            walletId: branchWallet.id,
            type: 'DEBIT',
            category: 'ROYALTY_SPLIT',
            amount: royaltyAmount,
            balanceBefore: currentBranchBal,
            balanceAfter: branchAfterRoyalty,
            reference: `wtx_br_royalty_${job.id}_${Date.now()}`,
            description: `Franchise royalty fee (${royaltyRate}%) to HQ for Job: ${job.title}`,
            jobId: job.id,
            invoiceId: primaryInvoiceId,
            metadata: { hqTenantId: parentTenant.id, royaltyRate, royaltyAmount },
          },
        });
        currentBranchBal = branchAfterRoyalty;

        // Credit HQ Wallet
        const hqBalBefore = Number(hqWallet.balance);
        const hqBalAfter = hqBalBefore + royaltyAmount;

        await tx.wallet.update({
          where: { id: hqWallet.id },
          data: {
            balance: hqBalAfter,
            ledgerBalance: Number(hqWallet.ledgerBalance) + royaltyAmount,
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: hqWallet.id,
            type: 'CREDIT',
            category: 'ROYALTY_SPLIT',
            amount: royaltyAmount,
            balanceBefore: hqBalBefore,
            balanceAfter: hqBalAfter,
            reference: `wtx_hq_royalty_${job.id}_${Date.now()}`,
            description: `Franchise royalty fee (${royaltyRate}%) from branch ${job.tenant.name} for Job: ${job.title}`,
            jobId: job.id,
            invoiceId: primaryInvoiceId,
            metadata: { branchTenantId: job.tenantId, royaltyRate, grossAmount },
          },
        });
      }

      // 3. Process Technician Commission (if applicable)
      let staffWalletId: string | null = null;
      if (commissionAmount > 0 && tech) {
        // Get or Create Staff Wallet
        let staffWallet = await tx.wallet.findUnique({
          where: { userId: tech.id },
        });

        if (!staffWallet) {
          staffWallet = await tx.wallet.create({
            data: {
              userId: tech.id,
              tenantId: job.tenantId,
              type: 'STAFF',
              currency,
              balance: 0,
              ledgerBalance: 0,
              lockedBalance: 0,
              status: 'ACTIVE',
            },
          });
        }
        staffWalletId = staffWallet.id;

        // Debit Branch Wallet for Tech Commission
        const branchAfterCommission = currentBranchBal - commissionAmount;
        await tx.walletTransaction.create({
          data: {
            walletId: branchWallet.id,
            type: 'DEBIT',
            category: 'COMMISSION_EARNED',
            amount: commissionAmount,
            balanceBefore: currentBranchBal,
            balanceAfter: branchAfterCommission,
            reference: `wtx_br_comm_${job.id}_${Date.now()}`,
            description: `Technician commission (${commissionRate}%) for ${tech.firstName} ${tech.lastName} on Job: ${job.title}`,
            jobId: job.id,
            invoiceId: primaryInvoiceId,
            metadata: { techId: tech.id, commissionRate, commissionAmount },
          },
        });
        currentBranchBal = branchAfterCommission;

        // Credit Staff Wallet
        const staffBalBefore = Number(staffWallet.balance);
        const staffBalAfter = staffBalBefore + commissionAmount;

        await tx.wallet.update({
          where: { id: staffWallet.id },
          data: {
            balance: staffBalAfter,
            ledgerBalance: Number(staffWallet.ledgerBalance) + commissionAmount,
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: staffWallet.id,
            type: 'CREDIT',
            category: 'COMMISSION_EARNED',
            amount: commissionAmount,
            balanceBefore: staffBalBefore,
            balanceAfter: staffBalAfter,
            reference: `wtx_staff_comm_${job.id}_${Date.now()}`,
            description: `Commission earned (${commissionRate}%) on Job: ${job.title}`,
            jobId: job.id,
            invoiceId: primaryInvoiceId,
            metadata: { jobId: job.id, commissionRate, grossAmount },
          },
        });
      }

      // Update Branch Wallet final balance
      await tx.wallet.update({
        where: { id: branchWallet.id },
        data: {
          balance: currentBranchBal,
          ledgerBalance: Number(branchWallet.ledgerBalance) + branchNetAmount,
        },
      });

      // Mark Job as split-settled
      await tx.job.update({
        where: { id: job.id },
        data: {
          splitSettled: true,
          splitSettledAt: now,
        },
      });

      return {
        grossAmount,
        branchNetAmount,
        royaltyAmount,
        royaltyRate,
        commissionAmount,
        commissionRate,
        currency,
        branchWalletId: branchWallet.id,
        hqWalletId,
        staffWalletId,
      };
    });

    // 6. Dual-Channel Real-Time Notifications
    // A. Notify Technician
    if (tech && settlementResult.commissionAmount > 0) {
      await this.notificationService.sendToUser(
        job.tenantId,
        tech.id,
        '💰 Commission Credited!',
        `₦${settlementResult.commissionAmount.toLocaleString()} commission earned for completing Job "${job.title}". Check your wallet balance!`,
        'SUCCESS',
        `/technician/wallet`,
      );
    }

    // B. Notify Branch Management
    await this.notificationService.sendToTenant(
      job.tenantId,
      '📈 Job Revenue Split Settled',
      `Job "${job.title}" settled: ₦${settlementResult.branchNetAmount.toLocaleString()} Net Profit, ₦${settlementResult.commissionAmount.toLocaleString()} Commission, ₦${settlementResult.royaltyAmount.toLocaleString()} Franchise Royalty.`,
      'INFO',
      `/dashboard/wallet`,
    );

    // C. Notify Corporate HQ (if royalty was split)
    if (parentTenant && settlementResult.royaltyAmount > 0) {
      await this.notificationService.sendToTenant(
        parentTenant.id,
        '🏢 Franchise Royalty Received',
        `Received ₦${settlementResult.royaltyAmount.toLocaleString()} royalty (${settlementResult.royaltyRate}%) from branch ${job.tenant.name} for Job "${job.title}".`,
        'SUCCESS',
        `/corporate/finances`,
      );
    }

    return {
      success: true,
      alreadySettled: false,
      settlement: settlementResult,
    };
  }
}
