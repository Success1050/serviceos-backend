import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { InvoiceStatus, ServiceModule } from '@prisma/client';
import { RequireModule } from '../../core/decorators/require-module.decorator';

@Controller('invoices')
@RequireModule(ServiceModule.MODULE_INVOICES)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @Permissions('admin_access')
  async create(
    @CurrentUser() user: any,
    @Body() createInvoiceDto: CreateInvoiceDto,
  ) {
    return this.invoiceService.createInvoice(user, createInvoiceDto);
  }

  /**
   * Day 8: 1-Click "Convert Quote to Invoice"
   */
  @Post('from-quote/:quoteId')
  @Permissions('admin_access')
  async convertFromQuote(
    @CurrentUser() user: any,
    @Param('quoteId') quoteId: string,
  ) {
    return this.invoiceService.convertQuoteToInvoice(user, quoteId);
  }

  @Get()
  @Permissions('admin_access')
  async findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('customerRecordId') customerRecordId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.invoiceService.getInvoices(user, {
      search,
      status,
      customerRecordId,
      tenantId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':id')
  @Permissions('admin_access')
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.invoiceService.getInvoice(user, id);
  }

  @Post(':id/send')
  @Permissions('admin_access')
  async send(
    @CurrentUser() user: any,
    @Param('id') invoiceId: string,
  ) {
    return this.invoiceService.sendInvoice(user, invoiceId);
  }

  /**
   * Day 8: Manual Payment Recording (Bank Transfer / Cash / POS)
   */
  @Post(':id/record-payment')
  @Permissions('admin_access')
  async recordPayment(
    @CurrentUser() user: any,
    @Param('id') invoiceId: string,
    @Body() recordPaymentDto: RecordPaymentDto,
  ) {
    return this.invoiceService.recordPayment(user, invoiceId, recordPaymentDto);
  }

  /**
   * Day 8: Multi-Gateway Online Checkout Initialization (Paystack / Stripe)
   */
  @Post(':id/pay')
  @Permissions('admin_access')
  async pay(
    @CurrentUser() user: any,
    @Param('id') invoiceId: string,
    @Body() payDto: PayInvoiceDto,
  ) {
    return this.invoiceService.payInvoice(user, invoiceId, payDto);
  }

  @Patch(':id/mark-paid')
  @Permissions('admin_access')
  async markAsPaid(
    @CurrentUser() user: any,
    @Param('id') invoiceId: string,
  ) {
    return this.invoiceService.markAsPaid(user, invoiceId);
  }

  @Patch(':id')
  @Permissions('admin_access')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateInvoiceDto>,
  ) {
    return this.invoiceService.updateInvoice(user, id, updateDto);
  }

  @Delete(':id')
  @Permissions('admin_access')
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.invoiceService.deleteInvoice(user, id);
  }
}
