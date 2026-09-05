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
}
