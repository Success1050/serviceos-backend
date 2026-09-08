import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Public } from '../../core/decorators/public.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  async create(
    @Body() createTenantDto: CreateTenantDto,
    @CurrentUser() user: any,
  ) {
    return this.tenantService.createTenant(createTenantDto, user.id);
  }

  @Public()
  @Get('s/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.tenantService.getTenantBySlug(slug);
  }

  @Post('sub-companies')
  async createSubCompany(
    @Body() createTenantDto: CreateTenantDto,
    @CurrentUser() user: any,
  ) {
    if (!user.tenantId || (user.role !== 'TENANT_OWNER' && user.role !== 'TENANT_ADMIN')) {
      throw new Error('Unauthorized to create sub-companies for this tenant');
    }
    return this.tenantService.createSubCompany(user.tenantId, createTenantDto);
  }
}
