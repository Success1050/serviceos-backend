import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import { FilterPayoutsDto } from './dto/filter-payouts.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Stage 28: Technician Personal Mobile Wallet
   * Real-time view of commission earnings, locked balance, and recent ledger entries
   */
  async getMyWallet(currentUser: any) {
    if (!currentUser.id) {
      throw new BadRequestException('User ID is required');
    }

    let wallet = await this.prisma.wallet.findUnique({
      where: { userId: currentUser.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        payoutRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { bankDetail: true },
        },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId: currentUser.id,
          tenantId: currentUser.tenantId,
          type: 'STAFF',
          currency: 'NGN',
          balance: 0,
          ledgerBalance: 0,
          lockedBalance: 0,
          status: 'ACTIVE',
        },
        include: {
          transactions: true,
          payoutRequests: { include: { bankDetail: true } },
        },
      });
    }

    const currentBalance = Number(wallet.balance);
    const lockedBalance = Number(wallet.lockedBalance);
    const availableBalance = Math.max(0, currentBalance - lockedBalance);

    // Calculate this month's earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyEarningsAgg = await this.prisma.walletTransaction.aggregate({
      where: {
        walletId: wallet.id,
        category: 'COMMISSION_EARNED',
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    const totalWithdrawnAgg = await this.prisma.walletTransaction.aggregate({
      where: {
        walletId: wallet.id,
        category: 'PAYOUT_SETTLED',
      },
      _sum: { amount: true },
    });

    const pendingPayoutsCount = await this.prisma.payoutRequest.count({
      where: {
        userId: currentUser.id,
        status: { in: ['PENDING_APPROVAL', 'PROCESSING'] },
      },
    });

    return {
      walletId: wallet.id,
      currency: wallet.currency,
      status: wallet.status,
      availableBalance,
      totalBalance: currentBalance,
      lockedBalance,
      earnedThisMonth: Number(monthlyEarningsAgg._sum.amount || 0),
      totalWithdrawn: Number(totalWithdrawnAgg._sum.amount || 0),
      pendingPayoutsCount,
      recentTransactions: wallet.transactions,
      recentPayouts: wallet.payoutRequests,
    };
  }

  /**
   * Stage 28: Branch Wallet Dashboard
   * Local revenue, royalties paid, staff commissions paid, and net operating profit
   */
  async getBranchWallet(currentUser: any) {
    if (!currentUser.tenantId) {
      throw new BadRequestException('User does not belong to a tenant');
    }

    let wallet = await this.prisma.wallet.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        type: 'BRANCH',
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 15,
        },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          tenantId: currentUser.tenantId,
          type: 'BRANCH',
          currency: 'NGN',
          balance: 0,
          ledgerBalance: 0,
          lockedBalance: 0,
          status: 'ACTIVE',
        },
        include: {
          transactions: true,
        },
      });
    }

    // Aggregate Branch Financial Performance
    const grossRevenueAgg = await this.prisma.walletTransaction.aggregate({
      where: { walletId: wallet.id, category: 'JOB_SETTLEMENT' },
      _sum: { amount: true },
    });

    const royaltiesPaidAgg = await this.prisma.walletTransaction.aggregate({
      where: { walletId: wallet.id, category: 'ROYALTY_SPLIT' },
      _sum: { amount: true },
    });

    const commissionsPaidAgg = await this.prisma.walletTransaction.aggregate({
      where: { walletId: wallet.id, category: 'COMMISSION_EARNED' },
      _sum: { amount: true },
    });

    const pendingStaffPayoutsCount = await this.prisma.payoutRequest.count({
      where: {
        tenantId: currentUser.tenantId,
        status: 'PENDING_APPROVAL',
      },
    });

    const grossVolume = Number(grossRevenueAgg._sum.amount || 0);
    const royaltiesPaid = Number(royaltiesPaidAgg._sum.amount || 0);
    const commissionsPaid = Number(commissionsPaidAgg._sum.amount || 0);
    const netProfit = grossVolume - royaltiesPaid - commissionsPaid;

    return {
      walletId: wallet.id,
      currency: wallet.currency,
      balance: Number(wallet.balance),
      grossVolume,
      royaltiesPaid,
      commissionsPaid,
      netProfit,
      pendingStaffPayoutsCount,
      recentTransactions: wallet.transactions,
    };
  }

  /**
   * Stage 28: Corporate HQ God-View Wallet
   * Aggregate franchise royalties across all child branches
   */
  async getHqWallet(currentUser: any) {
    if (!currentUser.tenantId) {
      throw new BadRequestException('User does not belong to a tenant');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: currentUser.tenantId },
      include: { children: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    let wallet = await this.prisma.wallet.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        type: 'HQ',
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          tenantId: currentUser.tenantId,
          type: 'HQ',
          currency: 'NGN',
          balance: 0,
          ledgerBalance: 0,
          lockedBalance: 0,
          status: 'ACTIVE',
        },
        include: { transactions: true },
      });
    }

    // Aggregate royalties collected
    const royaltiesCollectedAgg = await this.prisma.walletTransaction.aggregate({
      where: { walletId: wallet.id, category: 'ROYALTY_SPLIT' },
      _sum: { amount: true },
    });

    // Breakdown per franchisee branch
    const childBranchIds = tenant.children.map((c) => c.id);
    const branchBreakdown = await Promise.all(
      tenant.children.map(async (child) => {
        const branchWallet = await this.prisma.wallet.findFirst({
          where: { tenantId: child.id, type: 'BRANCH' },
        });

        let branchVolume = 0;
        let branchRoyalties = 0;

        if (branchWallet) {
          const vol = await this.prisma.walletTransaction.aggregate({
            where: { walletId: branchWallet.id, category: 'JOB_SETTLEMENT' },
            _sum: { amount: true },
          });
          const roy = await this.prisma.walletTransaction.aggregate({
            where: { walletId: branchWallet.id, category: 'ROYALTY_SPLIT' },
            _sum: { amount: true },
          });
          branchVolume = Number(vol._sum.amount || 0);
          branchRoyalties = Number(roy._sum.amount || 0);
        }

        return {
          branchId: child.id,
          branchName: child.name,
          slug: child.slug,
          grossVolume: branchVolume,
          royaltiesContributed: branchRoyalties,
        };
      })
    );

    return {
      walletId: wallet.id,
      currency: wallet.currency,
      balance: Number(wallet.balance),
      totalRoyaltiesCollected: Number(royaltiesCollectedAgg._sum.amount || 0),
      franchiseBranchesCount: tenant.children.length,
      branchBreakdown,
      recentTransactions: wallet.transactions,
    };
  }

  /**
   * Stage 28: Filterable Ledger History
   */
  async getTransactions(currentUser: any, dto: FilterTransactionsDto) {
    const isStaff = !currentUser.permissions?.includes('wallets_manage') && !currentUser.permissions?.includes('tenant_admin');
    const where: any = {};

    if (isStaff) {
      // Staff sees only their wallet transactions
      const staffWallet = await this.prisma.wallet.findUnique({
        where: { userId: currentUser.id },
      });
      if (!staffWallet) return { total: 0, items: [] };
      where.walletId = staffWallet.id;
    } else {
      // Manager sees branch transactions
      const branchWallet = await this.prisma.wallet.findFirst({
        where: { tenantId: currentUser.tenantId, type: 'BRANCH' },
      });
      if (!branchWallet) return { total: 0, items: [] };
      where.walletId = branchWallet.id;
    }

    if (dto.category) where.category = dto.category;
    if (dto.type) where.type = dto.type;

    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) where.createdAt.gte = new Date(dto.startDate);
      if (dto.endDate) where.createdAt.lte = new Date(dto.endDate);
    }

    const [total, items] = await Promise.all([
      this.prisma.walletTransaction.count({ where }),
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: dto.limit || 50,
        skip: dto.offset || 0,
        include: {
          job: { select: { id: true, title: true } },
          invoice: { select: { id: true, amount: true } },
        },
      }),
    ]);

    return { total, items, limit: dto.limit || 50, offset: dto.offset || 0 };
  }

  /**
   * Stage 28: List Payout Requests
   */
  async getPayoutRequests(currentUser: any, dto: FilterPayoutsDto) {
    const isStaffOnly = !currentUser.permissions?.includes('payouts_manage') && !currentUser.permissions?.includes('hr_manage') && !currentUser.permissions?.includes('tenant_admin');
    const where: any = {};

    if (isStaffOnly) {
      where.userId = currentUser.id;
    } else {
      where.tenantId = currentUser.tenantId;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    const [total, items] = await Promise.all([
      this.prisma.payoutRequest.count({ where }),
      this.prisma.payoutRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: dto.limit || 50,
        skip: dto.offset || 0,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, phone: true } },
          bankDetail: true,
          reviewedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return { total, items, limit: dto.limit || 50, offset: dto.offset || 0 };
  }

  /**
   * Stage 28: Get single payout request by ID
   */
  async getPayoutById(currentUser: any, payoutId: string) {
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phone: true } },
        bankDetail: true,
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
        walletTransactions: true,
      },
    });

    if (!payout) {
      throw new NotFoundException(`Payout request ${payoutId} not found`);
    }

    const isStaff = payout.userId === currentUser.id;
    const isTenantAdmin = payout.tenantId === currentUser.tenantId;

    if (!isStaff && !isTenantAdmin) {
      throw new ForbiddenException('Access denied to this payout record');
    }

    return payout;
  }
}
