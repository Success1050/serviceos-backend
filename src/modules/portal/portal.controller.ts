import { Controller, Get, Patch, Post, Body, Param, BadRequestException, Req } from '@nestjs/common';
import { PortalService } from './portal.service';
import { Public } from '../../core/decorators/public.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CreateServiceRequestDto } from '../service-request/dto/create-service-request.dto';
import { AcceptQuoteDto } from './dto/accept-quote.dto';

@Controller('portal/:slug')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  // ==========================================
  // PUBLIC AUTHENTICATION & MAGIC LINKS
  // ==========================================

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
    @Body() acceptDto: AcceptQuoteDto,
    @Req() req: any,
  ) {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    return this.portalService.acceptQuote(slug, quoteId, acceptDto, String(clientIp));
  }

  @Public()
  @Get('invoices/:invoiceId')
  async getInvoice(
    @Param('slug') slug: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.portalService.getInvoiceForCustomer(slug, invoiceId);
  }

  // ==========================================
  // AUTHENTICATED CUSTOMER PORTAL ENDPOINTS
  // ==========================================

  @Get('dashboard')
  @Permissions('customer_portal', 'admin_access')
  async getDashboard(
    @Param('slug') slug: string,
    @CurrentUser() user: any,
  ) {
    if (!user.tenantId || !user.relationshipId) {
      throw new BadRequestException('Invalid customer context');
    }
    return this.portalService.getDashboard(user.tenantId, user.relationshipId);
  }

  // --- LIVE TECHNICIAN TRACKING ENGINE ---

  @Get('jobs/:jobId/tracking')
  @Permissions('customer_portal', 'admin_access')
  async getJobTracking(
    @Param('slug') slug: string,
    @Param('jobId') jobId: string,
    @CurrentUser() user: any,
  ) {
    if (!user.tenantId || !user.relationshipId) {
      throw new BadRequestException('Invalid customer context');
    }
    return this.portalService.getLiveJobTracking(user.tenantId, user.relationshipId, jobId);
  }

  // --- DIRECT SERVICE CALL PIPELINE ---

  @Post('service-requests')
  @Permissions('customer_portal', 'admin_access')
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

  @Get('service-requests')
  @Permissions('customer_portal', 'admin_access')
  async getServiceRequests(
    @Param('slug') slug: string,
    @CurrentUser() user: any,
  ) {
    if (!user.tenantId || !user.relationshipId) {
      throw new BadRequestException('Invalid customer context');
    }
    return this.portalService.getCustomerServiceRequests(user.tenantId, user.relationshipId);
  }

  // --- SELF-SERVE INVOICES HISTORY ---

  @Get('history/invoices')
  @Permissions('customer_portal', 'admin_access')
  async getInvoicesHistory(
    @Param('slug') slug: string,
    @CurrentUser() user: any,
  ) {
    if (!user.tenantId || !user.relationshipId) {
      throw new BadRequestException('Invalid customer context');
    }
    return this.portalService.getInvoicesHistory(user.tenantId, user.relationshipId);
  }

  @Get('history/invoices/:invoiceId')
  @Permissions('customer_portal', 'admin_access')
  async getInvoiceDetails(
    @Param('slug') slug: string,
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: any,
  ) {
    if (!user.tenantId || !user.relationshipId) {
      throw new BadRequestException('Invalid customer context');
    }
    return this.portalService.getInvoiceDetails(user.tenantId, user.relationshipId, invoiceId);
  }

  // --- SELF-SERVE JOB HISTORY ---

  @Get('history/jobs')
  @Permissions('customer_portal', 'admin_access')
  async getJobsHistory(
    @Param('slug') slug: string,
    @CurrentUser() user: any,
  ) {
    if (!user.tenantId || !user.relationshipId) {
      throw new BadRequestException('Invalid customer context');
    }
    return this.portalService.getJobsHistory(user.tenantId, user.relationshipId);
  }

  @Get('history/jobs/:jobId')
  @Permissions('customer_portal', 'admin_access')
  async getJobDetails(
    @Param('slug') slug: string,
    @Param('jobId') jobId: string,
    @CurrentUser() user: any,
  ) {
    if (!user.tenantId || !user.relationshipId) {
      throw new BadRequestException('Invalid customer context');
    }
    return this.portalService.getJobDetails(user.tenantId, user.relationshipId, jobId);
  }

  // --- SELF-SERVE ASSETS & WARRANTY PORTFOLIO ---

  @Get('history/assets')
  @Permissions('customer_portal', 'admin_access')
  async getAssetsHistory(
    @Param('slug') slug: string,
    @CurrentUser() user: any,
  ) {
    if (!user.tenantId || !user.relationshipId) {
      throw new BadRequestException('Invalid customer context');
    }
    return this.portalService.getAssetsHistory(user.tenantId, user.relationshipId);
  }

  @Get('history/assets/:assetId')
  @Permissions('customer_portal', 'admin_access')
  async getAssetDetails(
    @Param('slug') slug: string,
    @Param('assetId') assetId: string,
    @CurrentUser() user: any,
  ) {
    if (!user.tenantId || !user.relationshipId) {
      throw new BadRequestException('Invalid customer context');
    }
    return this.portalService.getAssetDetails(user.tenantId, user.relationshipId, assetId);
  }
}
