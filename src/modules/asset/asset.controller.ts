import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { AssetStatus, ServiceModule } from '@prisma/client';
import { RequireModule } from '../../core/decorators/require-module.decorator';

@Controller('assets')
@RequireModule(ServiceModule.MODULE_CRM)
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @Permissions('admin_access')
  async create(
    @CurrentUser() user: any,
    @Body() createAssetDto: CreateAssetDto,
  ) {
    return this.assetService.createAsset(user, createAssetDto);
  }

  @Get()
  @Permissions('admin_access')
  async findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: AssetStatus,
    @Query('customerRecordId') customerRecordId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.assetService.getAssets(user, {
      search,
      status,
      customerRecordId,
      tenantId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':id')
  @Permissions('admin_access')
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.assetService.getAsset(user, id);
  }

  @Patch(':id')
  @Permissions('admin_access')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateAssetDto: UpdateAssetDto,
  ) {
    return this.assetService.updateAsset(user, id, updateAssetDto);
  }

  @Delete(':id')
  @Permissions('admin_access')
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.assetService.deleteAsset(user, id);
  }
}
