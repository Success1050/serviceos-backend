import { Controller, Get, Patch, Post, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { PortalService } from './portal.service';
import { Public } from '../../core/decorators/public.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CreateServiceRequestDto } from '../service-request/dto/create-service-request.dto';

@Controller('portal/:slug')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Post('service-requests')
  @Permissions('admin_access')
  async createServiceRequest(
    @Param('slug') slug: string,
    @CurrentUser() user: any,
    @Body() createDto: CreateServiceRequestDto,
  ) {
    if (!user.tenantId || !user.relationshipId) {
      throw new BadRequestException('Invalid customer context');
    }
    return this.portalService.createServiceRequest(user.tenantId, user.relationshipId, createDto);
  }

  @Public()
  @Get('quotes/:quoteId')
  async getQuote(
    @Param('slug') slug: string,
    @Param('quoteId') quoteId: string,
  ) {
    return this.portalService.getQuoteForCustomer(slug, quoteId);
  }

  @Public()
  @Patch('quotes/:quoteId/accept')
  async acceptQuote(
    @Param('slug') slug: string,
    @Param('quoteId') quoteId: string,
  ) {
    return this.portalService.acceptQuote(slug, quoteId);
  }

  @Public()
  @Get('invoices/:invoiceId')
  async getInvoice(
    @Param('slug') slug: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.portalService.getInvoiceForCustomer(slug, invoiceId);
  }

  @Public()
  @Post('auth/request-otp')
  async requestOtp(
    @Param('slug') slug: string,
    @Body() requestOtpDto: RequestOtpDto,
  ) {
    return this.portalService.requestOtp(slug, requestOtpDto.phone);
  }

  @Public()
  @Post('auth/verify-otp')
  async verifyOtp(
    @Param('slug') slug: string,
    @Body() verifyOtpDto: VerifyOtpDto,
  ) {
    return this.portalService.verifyOtp(slug, verifyOtpDto.phone, verifyOtpDto.code);
  }

  @Get('dashboard')
  @Permissions('admin_access')
  async getDashboard(
    @Param('slug') slug: string,
    @CurrentUser() user: any,
  ) {
    if (!user.tenantId || !user.relationshipId) {
      throw new BadRequestException('Invalid customer context');
    }
    // We already verified the user has the 'CUSTOMER' role via RolesGuard.
    return this.portalService.getDashboard(user.tenantId, user.relationshipId);
  }
}
