import { Controller, Post, Get, Body, Param, Query, Req, Ip, Headers } from '@nestjs/common';
import { HrService } from './hr.service';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { CreateOverTheDeskTechDto } from './dto/create-over-the-desk-tech.dto';
import { UploadHrDocumentDto } from './dto/upload-hr-document.dto';
import { ReviewProxyVerificationDto } from './dto/review-proxy-verification.dto';
import { FilterTechniciansDto } from './dto/filter-technicians.dto';
import { AcknowledgeTermsDto } from './dto/acknowledge-terms.dto';
import { ServiceModule } from '@prisma/client';
import { RequireModule } from '../../core/decorators/require-module.decorator';

@Controller('hr')
@RequireModule(ServiceModule.MODULE_BLUE_COLLAR_HR)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  /**
   * Branch Manager: Over-the-desk technician onboarding without requiring email.
   */
  @Post('technicians/over-the-desk')
  @Permissions('manage_branch_technicians', 'manage_staff', 'admin_access')
  async createOverTheDeskTech(
    @CurrentUser() user: any,
    @Body() dto: CreateOverTheDeskTechDto,
  ) {
    return this.hrService.createOverTheDeskTech(user, dto);
  }

  /**
   * Branch Manager: Upload document (ID photo, live selfie, certificate, CV) to technician file.
   */
  @Post('technicians/:id/documents')
  @Permissions('manage_branch_technicians', 'manage_staff', 'admin_access')
  async uploadHrDocument(
    @CurrentUser() user: any,
    @Param('id') techId: string,
    @Body() dto: UploadHrDocumentDto,
  ) {
    return this.hrService.uploadHrDocument(user, techId, dto);
  }

  /**
   * Branch / HQ: Retrieve complete technician dossier with documents & verification audit trail.
   */
  @Get('technicians/:id/dossier')
  @Permissions('view_technician_hr_records', 'manage_branch_technicians', 'manage_staff', 'admin_access')
  async getTechnicianDossier(
    @CurrentUser() user: any,
    @Param('id') techId: string,
  ) {
    return this.hrService.getTechnicianDossier(user, techId);
  }

  /**
   * Branch Manager: List branch technicians with filters, search, and pagination.
   */
  @Get('technicians')
  @Permissions('view_technician_hr_records', 'manage_branch_technicians', 'manage_staff', 'admin_access')
  async listBranchTechnicians(
    @CurrentUser() user: any,
    @Query() filter: FilterTechniciansDto,
  ) {
    return this.hrService.listBranchTechnicians(user, filter);
  }

  /**
   * Corporate HQ God-View: Lists all pending proxy verifications across all franchisee branches.
   */
  @Get('hq/verifications/pending')
  @Permissions('verify_technician_hires', 'admin_access')
  async getPendingProxyVerifications(@CurrentUser() user: any) {
    return this.hrService.getPendingProxyVerifications(user);
  }

  /**
   * Corporate HQ Decision Engine: Approve or Reject branch technician hire with audit log.
   */
  @Post('hq/verifications/:id/review')
  @Permissions('verify_technician_hires', 'admin_access')
  async reviewProxyVerification(
    @CurrentUser() user: any,
    @Param('id') techId: string,
    @Body() dto: ReviewProxyVerificationDto,
  ) {
    return this.hrService.reviewProxyVerification(user, techId, dto);
  }

  /**
   * The "Big Button" Legal Compensation Acknowledgment.
   * Field technicians accept their agreed commission rate upon first mobile login.
   */
  @Post('technicians/me/acknowledge-terms')
  async acknowledgeTerms(
    @CurrentUser() user: any,
    @Body() dto: AcknowledgeTermsDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const clientIp = ip || '127.0.0.1';
    const clientUa = userAgent || 'Mobile Field Web App';
    return this.hrService.acknowledgeTerms(user, dto, clientIp, clientUa);
  }

  /**
   * Field Technician: Fetch own commission rate, branch details, and agreement status.
   */
  @Get('technicians/me/compensation')
  async getMyCompensation(@CurrentUser() user: any) {
    return this.hrService.getMyCompensation(user);
  }
}
