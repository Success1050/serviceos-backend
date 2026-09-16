import { Controller, Get, Post, Body, Param, Req, UseGuards, Headers } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtGuard } from '../../core/auth/jwt.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { AuthorizeHoldDto } from './dto/authorize-hold.dto';
import { ReleaseHoldDto } from './dto/capture-hold.dto';
import { InitializeCheckoutDto, CreateMilestoneInvoiceDto } from './dto/initialize-checkout.dto';
import { LogBankTransferDto } from './dto/log-bank-transfer.dto';
import { GatewayType } from './adapters/payment-gateway.interface';

@Controller('payments')
@UseGuards(JwtGuard, PermissionsGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('escrow/authorize')
  @Permissions('payments_manage')
  async authorizeHold(@CurrentUser() user: any, @Body() dto: AuthorizeHoldDto) {
    return this.paymentService.authorizePreArrivalHoldForJob(dto.jobId, user.tenantId, dto.paymentMethodToken);
  }

  @Post('escrow/:id/capture')
  @Permissions('payments_manage')
  async captureHold(@CurrentUser() user: any, @Param('id') holdId: string) {
    // Finds hold and captures for the job
    return this.paymentService.captureEscrowHoldForJob(holdId, user.tenantId);
  }

  @Post('escrow/:id/release')
  @Permissions('payments_manage')
  async releaseHold(
    @CurrentUser() user: any,
    @Param('id') holdId: string,
    @Body() dto: ReleaseHoldDto,
  ) {
    return this.paymentService.releaseEscrowHold(holdId, user.tenantId, dto?.reason);
  }

  @Get('escrow')
  @Permissions('payments_view')
  async getEscrowHolds(@CurrentUser() user: any) {
    return this.paymentService.getEscrowHolds(user.tenantId);
  }

  @Post('milestones/:id/invoice')
  @Permissions('milestone_manage')
  async convertMilestoneToInvoice(
    @CurrentUser() user: any,
    @Param('id') milestoneId: string,
    @Body() dto: Partial<CreateMilestoneInvoiceDto>,
  ) {
    return this.paymentService.convertMilestoneToInvoice(user.tenantId, milestoneId, dto?.dueInDays);
  }

  @Post('checkout')
  @Permissions('payments_manage')
  async initializeCheckout(@CurrentUser() user: any, @Body() dto: InitializeCheckoutDto) {
    return this.paymentService.initializeCheckout(user.tenantId, dto.invoiceId, dto.callbackUrl);
  }

  @Post('bank-transfer/confirm')
  @Permissions('payments_manage')
  async logBankTransfer(@CurrentUser() user: any, @Body() dto: LogBankTransferDto) {
    return this.paymentService.logManualBankTransfer(user.tenantId, user.id, dto);
  }

  @Public()
  @Post('webhook/:gateway')
  async handleWebhook(
    @Param('gateway') gateway: string,
    @Body() payload: any,
    @Headers('x-paystack-signature') paystackSignature?: string,
    @Headers('stripe-signature') stripeSignature?: string,
  ) {
    const gatewayUpper = gateway.toUpperCase() as GatewayType;
    const signature = paystackSignature || stripeSignature;
    return this.paymentService.handleWebhook(gatewayUpper, payload, signature);
  }
}
