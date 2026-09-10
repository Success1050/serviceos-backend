import { Controller, Post, Get, Body, BadRequestException } from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @Permissions('admin_access')
  async create(
    @CurrentUser() user: any,
    @Body() createAssetDto: CreateAssetDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.assetService.createAsset(user.tenantId, createAssetDto);
  }

  @Get()
  @Permissions('admin_access')
  async findAll(@CurrentUser() user: any) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.assetService.getAssets(user.tenantId);
  }
}
