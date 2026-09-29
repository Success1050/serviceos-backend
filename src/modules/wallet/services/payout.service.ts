import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { PaystackAdapter } from '../../payment/adapters/paystack.adapter';
import { NotificationService } from '../../notification/notification.service';
import { CreatePayoutRequestDto } from '../dto/create-payout-request.dto';
import { ResolveBankDto } from '../dto/resolve-bank.dto';
import { CreateBankDetailDto } from '../dto/create-bank-detail.dto';
import { ReviewPayoutDto, RejectPayoutDto } from '../dto/review-payout.dto';

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackAdapter: PaystackAdapter,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Stage 28: Fetch supported banks for payout destination
   */
  async getSupportedBanks() {
    return this.paystackAdapter.getBanks();
  }

  /**
   * Stage 28: Resolve NUBAN Bank Account Number against bank code
   */
  async resolveBankAccount(dto: ResolveBankDto) {
    return this.paystackAdapter.resolveBankAccount(dto.accountNumber, dto.bankCode);
  }

  /**
   * Stage 28: Register and verify staff bank details
   */
  async createBankDetail(currentUser: any, dto: CreateBankDetailDto) {
    if (!currentUser.id || !currentUser.tenantId) {
      throw new BadRequestException('User must belong to a tenant to register bank details');
    }

    // 1. Verify / Resolve account with Paystack
    const resolved = await this.paystackAdapter.resolveBankAccount(dto.accountNumber, dto.bankCode);
    const verifiedAccountName = resolved.accountName || dto.accountName;

    // 2. Create Paystack Transfer Recipient token
    let recipientCode: string | null = null;
    try {
      const recipientRes = await this.paystackAdapter.createTransferRecipient({
        name: verifiedAccountName,
        accountNumber: dto.accountNumber,
        bankCode: dto.bankCode,
        currency: 'NGN',
        description: `ServiceOS Staff - ${currentUser.email || currentUser.phone || 'Tech'}`,
      });
      recipientCode = recipientRes.recipientCode;
    } catch (err: any) {
      this.logger.warn(`Failed to create Paystack recipient token: ${err.message}. Proceeding with local verification.`);
    }

    // 3. If setting as default, unset previous default
    if (dto.isDefault) {
      await this.prisma.staffBankDetail.updateMany({
        where: { userId: currentUser.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // 4. Upsert StaffBankDetail record
    const bankDetail = await this.prisma.staffBankDetail.upsert({
      where: {
        userId_accountNumber_bankCode: {
          userId: currentUser.id,
          accountNumber: dto.accountNumber,
          bankCode: dto.bankCode,
        },
      },
      update: {
        bankName: dto.bankName,
        accountName: verifiedAccountName,
        recipientCode: recipientCode || undefined,
        isDefault: dto.isDefault ?? true,
        isVerified: true,
      },
      create: {
        userId: currentUser.id,
        tenantId: currentUser.tenantId,
        bankName: dto.bankName,
        bankCode: dto.bankCode,
        accountNumber: dto.accountNumber,
        accountName: verifiedAccountName,
        recipientCode,
        isDefault: dto.isDefault ?? true,
        isVerified: true,
      },
    });

    return bankDetail;
  }

  /**
   * Stage 28: Get authenticated staff's registered bank accounts
   */
  async getStaffBankDetails(currentUser: any) {
    return this.prisma.staffBankDetail.findMany({
      where: { userId: currentUser.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Stage 28: Technician initiates a Payout / Withdrawal Request
   * Locks requested amount in the wallet to prevent double-spending
   */
  async requestPayout(currentUser: any, dto: CreatePayoutRequestDto) {
    if (!currentUser.id || !currentUser.tenantId) {
      throw new BadRequestException('User does not belong to a valid tenant');
    }

    const requestedAmount = Number(dto.amount);
    if (requestedAmount <= 0) {
      throw new BadRequestException('Payout amount must be greater than zero');
    }

    // 1. Verify selected bank detail
    const bankDetail = await this.prisma.staffBankDetail.findUnique({
      where: { id: dto.bankDetailId },
    });

    if (!bankDetail || bankDetail.userId !== currentUser.id) {
      throw new NotFoundException('Selected bank account not found or does not belong to you');
    }

    // 2. Fetch or create staff wallet
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId: currentUser.id },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId: currentUser.id,
          tenantId: currentUser.tenantId,
          type: 'STAFF',
          currency: dto.currency || 'NGN',
          balance: 0,
          ledgerBalance: 0,
          lockedBalance: 0,
          status: 'ACTIVE',
        },
      });
    }

    if (wallet.status !== 'ACTIVE') {
      throw new ForbiddenException(`Wallet is currently ${wallet.status}. Withdrawals are locked.`);
    }

    const currentBalance = Number(wallet.balance);
    const currentLocked = Number(wallet.lockedBalance);
    const availableBalance = currentBalance - currentLocked;

    if (requestedAmount > availableBalance) {
      throw new BadRequestException(
        `Insufficient available balance. Available: ₦${availableBalance.toLocaleString()}, Requested: ₦${requestedAmount.toLocaleString()}`
      );
    }

    // 3. Execute atomic fund reservation & PayoutRequest creation
    const reference = `payout_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const newLockedBalance = currentLocked + requestedAmount;

      // Update wallet locked balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { lockedBalance: newLockedBalance },
      });

      // Create PayoutRequest
      const payout = await tx.payoutRequest.create({
        data: {
          walletId: wallet.id,
          userId: currentUser.id,
          tenantId: currentUser.tenantId,
          bankDetailId: bankDetail.id,
          amount: requestedAmount,
          fee: 0,
          currency: wallet.currency,
          status: 'PENDING_APPROVAL',
          reference,
          metadata: {
            bankName: bankDetail.bankName,
            accountNumber: bankDetail.accountNumber,
            accountName: bankDetail.accountName,
          },
        },
        include: {
          bankDetail: true,
        },
      });

      // Log Ledger Entry (type: DEBIT, category: PAYOUT_REQUEST)
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEBIT',
          category: 'PAYOUT_REQUEST',
          amount: requestedAmount,
          balanceBefore: currentBalance,
          balanceAfter: currentBalance, // balance remains until disbursement; lockedBalance reserves it
          reference: `wtx_${reference}`,
          description: `Payout request of ₦${requestedAmount.toLocaleString()} to ${bankDetail.bankName} (${bankDetail.accountNumber})`,
          payoutRequestId: payout.id,
          metadata: { locked: true, availableRemaining: availableBalance - requestedAmount },
        },
      });

      return payout;
    });

    // 4. Notify Branch Management of pending withdrawal
    await this.notificationService.sendToTenant(
      currentUser.tenantId,
      '📋 New Staff Payout Request',
      `Technician ${currentUser.firstName || ''} ${currentUser.lastName || ''} requested a withdrawal of ₦${requestedAmount.toLocaleString()}. Approval required.`,
      'INFO',
      `/dashboard/payouts/${result.id}`,
    );

    return result;
  }

  /**
   * Stage 28: Branch Manager approves and triggers Paystack automated transfer
   */
  async approvePayout(currentUser: any, payoutId: string, dto?: ReviewPayoutDto) {
    if (!currentUser.tenantId) {
      throw new ForbiddenException('User must belong to a tenant to review payouts');
    }

    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: {
        wallet: true,
        bankDetail: true,
        user: true,
      },
    });

    if (!payout) {
      throw new NotFoundException(`Payout request ${payoutId} not found`);
    }

    // Multi-tenant check: ensure payout belongs to manager's tenant (or manager is HQ)
    if (payout.tenantId !== currentUser.tenantId) {
      const currentTenant = await this.prisma.tenant.findUnique({ where: { id: currentUser.tenantId } });
      const payoutTenant = await this.prisma.tenant.findUnique({ where: { id: payout.tenantId } });
      const isParentHq = payoutTenant?.parentId === currentUser.tenantId;

      if (!isParentHq) {
        throw new ForbiddenException('You cannot review payouts belonging to another tenant');
      }
    }

    if (payout.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Cannot approve payout in status "${payout.status}". Only PENDING_APPROVAL allowed.`);
    }

    const amount = Number(payout.amount);
    let recipientCode = payout.bankDetail.recipientCode;

    // Create Paystack recipient code on-the-fly if missing
    if (!recipientCode) {
      const recipientRes = await this.paystackAdapter.createTransferRecipient({
        name: payout.bankDetail.accountName,
        accountNumber: payout.bankDetail.accountNumber,
        bankCode: payout.bankDetail.bankCode,
        currency: payout.currency,
      });
      recipientCode = recipientRes.recipientCode;

      await this.prisma.staffBankDetail.update({
        where: { id: payout.bankDetail.id },
        data: { recipientCode },
      });
    }

    // 1. Mark status PROCESSING
    await this.prisma.payoutRequest.update({
      where: { id: payout.id },
      data: { status: 'PROCESSING', reviewedById: currentUser.id, reviewedAt: new Date(), reviewNotes: dto?.reviewNotes },
    });

    // 2. Initiate Transfer via Paystack Transfers API
    const transferResult = await this.paystackAdapter.initiateTransfer({
      amount,
      recipientCode,
      reference: payout.reference,
      reason: `ServiceOS Payout - ${payout.user.firstName} ${payout.user.lastName}`,
    });

    const now = new Date();

    if (transferResult.success) {
      // 3. Atomically finalize payout settlement
      const updated = await this.prisma.$transaction(async (tx) => {
        const currentBal = Number(payout.wallet.balance);
        const currentLocked = Number(payout.wallet.lockedBalance);

        const newBal = Math.max(0, currentBal - amount);
        const newLocked = Math.max(0, currentLocked - amount);

        // Deduct from wallet
        await tx.wallet.update({
          where: { id: payout.wallet.id },
          data: {
            balance: newBal,
            lockedBalance: newLocked,
            ledgerBalance: Number(payout.wallet.ledgerBalance) - amount,
          },
        });

        // Update PayoutRequest
        const finishedPayout = await tx.payoutRequest.update({
          where: { id: payout.id },
          data: {
            status: 'SUCCESSFUL',
            transferCode: transferResult.transferCode,
            settledAt: now,
          },
          include: { bankDetail: true },
        });

        // Record Ledger Entry
        await tx.walletTransaction.create({
          data: {
            walletId: payout.wallet.id,
            type: 'DEBIT',
            category: 'PAYOUT_SETTLED',
            amount,
            balanceBefore: currentBal,
            balanceAfter: newBal,
            reference: `wtx_disbursed_${payout.reference}`,
            description: `Automated payout of ₦${amount.toLocaleString()} settled to ${payout.bankDetail.bankName} (${payout.bankDetail.accountNumber})`,
            payoutRequestId: payout.id,
            metadata: { transferCode: transferResult.transferCode, raw: transferResult.rawResponse },
          },
        });

        // Create immutable AuditLog
        await tx.auditLog.create({
          data: {
            tenantId: payout.tenantId,
            userId: currentUser.id,
            action: 'APPROVE_PAYOUT',
            entityType: 'PayoutRequest',
            entityId: payout.id,
            details: {
              amount,
              technicianId: payout.userId,
              bankName: payout.bankDetail.bankName,
              accountNumber: payout.bankDetail.accountNumber,
              transferCode: transferResult.transferCode,
            },
          },
        });

        return finishedPayout;
      });

      // 4. Notify technician of successful payout
      await this.notificationService.sendToUser(
        payout.tenantId,
        payout.userId,
        '💸 Payout Transferred!',
        `₦${amount.toLocaleString()} has been sent to your ${payout.bankDetail.bankName} account (${payout.bankDetail.accountNumber}).`,
        'SUCCESS',
        `/technician/wallet`,
      );

      return {
        success: true,
        status: 'SUCCESSFUL',
        payout: updated,
      };
    } else {
      // Transfer initiation failed: revert status or mark failed
      this.logger.error(`Automated payout transfer failed for payout ${payout.id}: ${transferResult.failureReason}`);

      await this.prisma.payoutRequest.update({
        where: { id: payout.id },
        data: {
          status: 'FAILED',
          failureReason: transferResult.failureReason,
        },
      });

      return {
        success: false,
        status: 'FAILED',
        failureReason: transferResult.failureReason,
        payoutId: payout.id,
      };
    }
  }

  /**
   * Stage 28: Branch Manager rejects payout request
   * Releases locked funds back to available balance
   */
  async rejectPayout(currentUser: any, payoutId: string, dto: RejectPayoutDto) {
    if (!currentUser.tenantId) {
      throw new ForbiddenException('User must belong to a tenant to reject payouts');
    }

    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { wallet: true, bankDetail: true },
    });

    if (!payout) {
      throw new NotFoundException(`Payout request ${payoutId} not found`);
    }

    if (payout.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Cannot reject payout in status "${payout.status}". Only PENDING_APPROVAL allowed.`);
    }

    const amount = Number(payout.amount);

    const result = await this.prisma.$transaction(async (tx) => {
      const currentLocked = Number(payout.wallet.lockedBalance);
      const newLocked = Math.max(0, currentLocked - amount);

      // Release locked funds
      await tx.wallet.update({
        where: { id: payout.wallet.id },
        data: { lockedBalance: newLocked },
      });

      // Update PayoutRequest
      const rejectedPayout = await tx.payoutRequest.update({
        where: { id: payout.id },
        data: {
          status: 'REJECTED',
          rejectionReason: dto.reason,
          reviewedById: currentUser.id,
          reviewedAt: new Date(),
        },
      });

      // Record Ledger Reversal Entry
      await tx.walletTransaction.create({
        data: {
          walletId: payout.wallet.id,
          type: 'CREDIT',
          category: 'PAYOUT_REVERSED',
          amount,
          balanceBefore: Number(payout.wallet.balance),
          balanceAfter: Number(payout.wallet.balance),
          reference: `wtx_rejected_${payout.reference}`,
          description: `Payout request rejected: ${dto.reason}. Funds unlocked.`,
          payoutRequestId: payout.id,
          metadata: { reason: dto.reason, reviewedBy: currentUser.id },
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          tenantId: payout.tenantId,
          userId: currentUser.id,
          action: 'REJECT_PAYOUT',
          entityType: 'PayoutRequest',
          entityId: payout.id,
          details: { amount, reason: dto.reason },
        },
      });

      return rejectedPayout;
    });

    // Notify technician
    await this.notificationService.sendToUser(
      payout.tenantId,
      payout.userId,
      '❌ Payout Request Rejected',
      `Your withdrawal of ₦${amount.toLocaleString()} was rejected: "${dto.reason}". Funds have been restored to your available balance.`,
      'WARNING',
      `/technician/wallet`,
    );

    return result;
  }

  /**
   * Stage 28: Handle Paystack Transfer Webhooks
   */
  async handleWebhook(payload: any) {
    const eventResult = await this.paystackAdapter.handleTransferWebhook(payload);

    if (eventResult.status === 'IGNORED') {
      return { handled: false, reason: 'Ignored non-transfer event' };
    }

    const payout = await this.prisma.payoutRequest.findUnique({
      where: { reference: eventResult.reference },
      include: { wallet: true },
    });

    if (!payout) {
      this.logger.warn(`Received transfer webhook for unknown reference: ${eventResult.reference}`);
      return { handled: false, reason: 'Unknown payout reference' };
    }

    const amount = Number(payout.amount);

    if (eventResult.status === 'SUCCESSFUL' && payout.status !== 'SUCCESSFUL') {
      await this.prisma.$transaction(async (tx) => {
        const currentBal = Number(payout.wallet.balance);
        const currentLocked = Number(payout.wallet.lockedBalance);

        await tx.wallet.update({
          where: { id: payout.wallet.id },
          data: {
            balance: Math.max(0, currentBal - amount),
            lockedBalance: Math.max(0, currentLocked - amount),
          },
        });

        await tx.payoutRequest.update({
          where: { id: payout.id },
          data: {
            status: 'SUCCESSFUL',
            transferCode: eventResult.transferCode || payout.transferCode,
            settledAt: new Date(),
          },
        });
      });

      return { handled: true, event: eventResult.event, status: 'SUCCESSFUL' };
    }

    if (eventResult.status === 'FAILED' || eventResult.status === 'REVERSED') {
      await this.prisma.$transaction(async (tx) => {
        const currentLocked = Number(payout.wallet.lockedBalance);

        // Refund / release locked balance
        await tx.wallet.update({
          where: { id: payout.wallet.id },
          data: {
            lockedBalance: Math.max(0, currentLocked - amount),
          },
        });

        await tx.payoutRequest.update({
          where: { id: payout.id },
          data: {
            status: 'FAILED',
            failureReason: eventResult.reason || 'Transfer failed or reversed by banking rails',
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: payout.wallet.id,
            type: 'CREDIT',
            category: 'PAYOUT_REVERSED',
            amount,
            balanceBefore: Number(payout.wallet.balance),
            balanceAfter: Number(payout.wallet.balance),
            reference: `wtx_wh_reversal_${payout.reference}_${Date.now()}`,
            description: `Transfer failed/reversed: ${eventResult.reason || 'Gateway error'}`,
            payoutRequestId: payout.id,
          },
        });
      });

      await this.notificationService.sendToUser(
        payout.tenantId,
        payout.userId,
        '⚠️ Transfer Failed / Reversed',
        `Your withdrawal of ₦${amount.toLocaleString()} could not be completed by the bank. Funds have been returned to your wallet.`,
        'ERROR',
        `/technician/wallet`,
      );

      return { handled: true, event: eventResult.event, status: 'FAILED' };
    }

    return { handled: true, event: eventResult.event };
  }
}
