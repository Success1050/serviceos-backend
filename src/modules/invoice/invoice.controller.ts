import { Controller, Post, Get, Patch, Body, Param, BadRequestException } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER, Role.ACCOUNTANT)
  async create(
    @CurrentUser() user: any,
    @Body() createInvoiceDto: CreateInvoiceDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.invoiceService.createInvoice(user.tenantId, createInvoiceDto);
  }

  @Get()
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER, Role.ACCOUNTANT)
  async findAll(@CurrentUser() user: any) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.invoiceService.getInvoices(user.tenantId);
  }

  @Post(':id/send')
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER, Role.ACCOUNTANT)
  async send(
    @CurrentUser() user: any,
    @Param('id') invoiceId: string,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.invoiceService.sendInvoice(user.tenantId, invoiceId);
  }

  @Patch(':id/pay')
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER, Role.ACCOUNTANT)
  async markAsPaid(
    @CurrentUser() user: any,
    @Param('id') invoiceId: string,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.invoiceService.markAsPaid(user.tenantId, invoiceId);
  }
}
