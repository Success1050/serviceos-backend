import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PayoutService } from './services/payout.service';
import { SplitSettlementService } from './services/split-settlement.service';
import { JwtGuard } from '../../core/auth/jwt.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { ResolveBankDto } from './dto/resolve-bank.dto';
import { CreateBankDetailDto } from './dto/create-bank-detail.dto';
import { CreatePayoutRequestDto } from './dto/create-payout-request.dto';
import { ReviewPayoutDto, RejectPayoutDto } from './dto/review-payout.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import { FilterPayoutsDto } from './dto/filter-payouts.dto';
import { SettleJobDto } from './dto/settle-job.dto';

@Controller('wallet')
@UseGuards(JwtGuard, PermissionsGuard)
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly payoutService: PayoutService,
    private readonly splitSettlementService: SplitSettlementService,
  ) {}

  /**
   * 1. Staff Personal Wallet Dashboard (Field Tech Mobile View)
   */
  @Get('my-wallet')
  async getMyWallet(@CurrentUser() user: any) {
    return this.walletService.getMyWallet(user);
  }

  /**
   * 2. Branch Operating Wallet Dashboard
   */
  @Get('branch-wallet')
  @Permissions('wallets_view')
  async getBranchWallet(@CurrentUser() user: any) {
    return this.walletService.getBranchWallet(user);
  }

  /**
   * 3. Corporate HQ Franchise Royalty Wallet (God-View)
   */
  @Get('hq-wallet')
  @Permissions('hq_admin')
  async getHqWallet(@CurrentUser() user: any) {
    return this.walletService.getHqWallet(user);
  }

  /**
   * 4. Banking Rails: List Supported Banks
   */
  @Get('banks')
  async getSupportedBanks() {
    return this.payoutService.getSupportedBanks();
  }

  /**
   * 5. Banking Rails: Resolve Bank Account Number
   */
  @Post('resolve-bank')
  @HttpCode(HttpStatus.OK)
  async resolveBankAccount(@Body() dto: ResolveBankDto) {
    return this.payoutService.resolveBankAccount(dto);
  }

  /**
   * 6. Banking Rails: Save Staff Bank Account
   */
  @Post('bank-details')
  async createBankDetail(@CurrentUser() user: any, @Body() dto: CreateBankDetailDto) {
    return this.payoutService.createBankDetail(user, dto);
  }

  /**
   * 7. Banking Rails: Get Staff Saved Accounts
   */
  @Get('bank-details')
  async getStaffBankDetails(@CurrentUser() user: any) {
    return this.payoutService.getStaffBankDetails(user);
  }

  /**
   * 8. Payout: Staff Requests Withdrawal
   */
  @Post('payout-requests')
  async requestPayout(@CurrentUser() user: any, @Body() dto: CreatePayoutRequestDto) {
    return this.payoutService.requestPayout(user, dto);
  }

  /**
   * 9. Payout: List Payout Requests
   */
  @Get('payout-requests')
  async getPayoutRequests(@CurrentUser() user: any, @Query() dto: FilterPayoutsDto) {
    return this.payoutService.getPayoutRequests(user, dto);
  }

  /**
   * 10. Payout: View Single Payout Details
   */
  @Get('payout-requests/:id')
  async getPayoutById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.walletService.getPayoutById(user, id);
  }

  /**
   * 11. Payout: Branch Manager Approves Withdrawal
   */
  @Post('payout-requests/:id/approve')
  @Permissions('payouts_manage')
  async approvePayout(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ReviewPayoutDto,
  ) {
    return this.payoutService.approvePayout(user, id, dto);
  }

  /**
   * 12. Payout: Branch Manager Rejects Withdrawal
   */
  @Post('payout-requests/:id/reject')
  @Permissions('payouts_manage')
  async rejectPayout(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: RejectPayoutDto,
  ) {
    return this.payoutService.rejectPayout(user, id, dto);
  }

  /**
   * 13. Audit Ledger: Filterable Transactions
   */
  @Get('transactions')
  async getTransactions(@CurrentUser() user: any, @Query() dto: FilterTransactionsDto) {
    return this.walletService.getTransactions(user, dto);
  }

  /**
   * 14. 3-Tier Split Settlement: Settle Job Revenue
   */
  @Post('jobs/:jobId/settle')
  @Permissions('wallets_manage')
  async settleJobRevenue(
    @Param('jobId') jobId: string,
    @Body() dto: SettleJobDto,
  ) {
    return this.splitSettlementService.settleJobRevenue(jobId, dto);
  }

  /**
   * 15. Public Webhook: Paystack Transfer Webhooks
   */
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    return this.payoutService.handleWebhook(payload);
  }
}
