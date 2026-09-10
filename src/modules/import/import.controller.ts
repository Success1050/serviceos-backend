import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ImportService } from './import.service';
import { AnalyzeImportDto } from './dto/analyze-import.dto';
import { PreviewImportDto } from './dto/preview-import.dto';
import { ExecuteImportDto } from './dto/execute-import.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

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
}
