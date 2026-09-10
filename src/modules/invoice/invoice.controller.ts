import { Controller, Post, Get, Patch, Body, Param, BadRequestException } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) { }

  @Post()
  @Permissions('admin_access')
  async create(
    @CurrentUser() user: any,
    @Body() createInvoiceDto: CreateInvoiceDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.invoiceService.createInvoice(user.tenantId, createInvoiceDto);
  }

  @Get()
  @Permissions('admin_access')
  async findAll(@CurrentUser() user: any) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.invoiceService.getInvoices(user.tenantId);
  }

  @Post(':id/send')
  @Permissions('admin_access')
  async send(
    @CurrentUser() user: any,
    @Param('id') invoiceId: string,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.invoiceService.sendInvoice(user.tenantId, invoiceId);
  }

  @Patch(':id/pay')
  @Permissions('admin_access')
  async markAsPaid(
    @CurrentUser() user: any,
    @Param('id') invoiceId: string,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.invoiceService.markAsPaid(user.tenantId, invoiceId);
  }
}
