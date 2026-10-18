import { Controller, Get, Post, Body, Param, Res, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { ImportService } from './import.service';
import { AnalyzeImportDto } from './dto/analyze-import.dto';
import { PreviewImportDto } from './dto/preview-import.dto';
import { ExecuteImportDto } from './dto/execute-import.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Public } from '../../core/decorators/public.decorator';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  // Download official backend-supported sample CSV template (Publicly accessible)
  @Public()
  @Get('template')
  getTemplate(@Res({ passthrough: true }) res: Response) {
    const csv = this.importService.getSampleCsvTemplate();
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="serviceos_customer_import_template.csv"',
    });
    return csv;
  }

  @Post('analyze')
  @Permissions('admin_access')
  analyze(@Body() analyzeDto: AnalyzeImportDto) {
    return this.importService.analyzeColumns(analyzeDto);
  }

  @Post('preview')
  @Permissions('admin_access')
  async preview(
    @CurrentUser() user: any,
    @Body() previewDto: PreviewImportDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.importService.previewImport(user.tenantId, previewDto);
  }

  @Post('execute')
  @Permissions('admin_access')
  async execute(
    @CurrentUser() user: any,
    @Body() executeDto: ExecuteImportDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.importService.executeImport(user.tenantId, executeDto);
  }

  // Enqueue as background Bull job for large datasets
  @Post('queue')
  @Permissions('admin_access')
  async queue(
    @CurrentUser() user: any,
    @Body() body: ExecuteImportDto & { activationChoice?: 'ALL' | 'PHONE_ONLY' | 'NONE' },
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.importService.queueImport(user.tenantId, body, body.activationChoice);
  }

  // Check background job progress and state
  @Get('status/:jobId')
  @Permissions('admin_access')
  async getStatus(@Param('jobId') jobId: string) {
    return this.importService.getJobStatus(jobId);
  }

  // Bulk background portal invitations
  @Post('batch-invite')
  @Permissions('admin_access')
  async batchInvite(
    @CurrentUser() user: any,
    @Body() body: { customerIds: string[] },
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    if (!body.customerIds || body.customerIds.length === 0) {
      throw new BadRequestException('customerIds array is required');
    }
    return this.importService.queueBatchInvitations(user.tenantId, body.customerIds);
  }
}
