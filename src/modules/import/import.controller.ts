import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ImportService } from './import.service';
import { AnalyzeImportDto } from './dto/analyze-import.dto';
import { PreviewImportDto } from './dto/preview-import.dto';
import { ExecuteImportDto } from './dto/execute-import.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('analyze')
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER, Role.SALES)
  analyze(@Body() analyzeDto: AnalyzeImportDto) {
    return this.importService.analyzeColumns(analyzeDto);
  }

  @Post('preview')
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER, Role.SALES)
  async preview(
    @CurrentUser() user: any,
    @Body() previewDto: PreviewImportDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.importService.previewImport(user.tenantId, previewDto);
  }

  @Post('execute')
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER, Role.SALES)
  async execute(
    @CurrentUser() user: any,
    @Body() executeDto: ExecuteImportDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.importService.executeImport(user.tenantId, executeDto);
  }
}
