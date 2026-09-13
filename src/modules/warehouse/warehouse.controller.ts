import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { JwtGuard } from '../../core/auth/jwt.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { EquipmentRequestDto } from './dto/equipment-request.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { AddStockDto } from './dto/add-stock.dto';

@UseGuards(JwtGuard, PermissionsGuard)
@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  @Permissions('warehouse_view', 'warehouse_create')
  async getWarehouses(@CurrentUser() user: any) {
    return this.warehouseService.getWarehouses(user.tenantId);
  }

  @Post()
  @Permissions('warehouse_create')
  async createWarehouse(@Body() createWarehouseDto: CreateWarehouseDto, @CurrentUser() user: any) {
    return this.warehouseService.createWarehouse(user.tenantId, createWarehouseDto);
  }

  @Get(':id/inventory')
  @Permissions('warehouse_view', 'warehouse_create')
  async getWarehouseInventory(@Param('id') warehouseId: string, @CurrentUser() user: any) {
    return this.warehouseService.getWarehouseInventory(user.tenantId, warehouseId);
  }

  @Post(':id/stock')
  @Permissions('warehouse_create')
  async addStock(
    @Param('id') warehouseId: string,
    @Body() addStockDto: AddStockDto,
    @CurrentUser() user: any,
  ) {
    return this.warehouseService.addStock(user.tenantId, warehouseId, addStockDto);
  }

  @Get('products')
  @Permissions('warehouse_view', 'warehouse_create', 'equipment_request_create')
  async getProducts(@CurrentUser() user: any) {
    return this.warehouseService.getProducts(user.tenantId);
  }

  @Post('products')
  @Permissions('warehouse_create')
  async createProduct(@Body() createProductDto: CreateProductDto, @CurrentUser() user: any) {
    return this.warehouseService.createProduct(user.tenantId, createProductDto);
  }

  @Get('requests')
  @Permissions('equipment_request_approve', 'equipment_request_create')
  async getEquipmentRequests(@Query('status') status: string, @CurrentUser() user: any) {
    return this.warehouseService.getEquipmentRequests(user.tenantId, status);
  }

  @Post('requests')
  @Permissions('equipment_request_create')
  async createEquipmentRequest(@Body() equipmentRequestDto: EquipmentRequestDto, @CurrentUser() user: any) {
    return this.warehouseService.createEquipmentRequest(user.tenantId, equipmentRequestDto);
  }

  @Patch('requests/:id/approve')
  @Permissions('equipment_request_approve')
  async approveRequest(
    @Param('id') requestId: string,
    @Body() approveRequestDto: ApproveRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.warehouseService.approveEquipmentRequest(user.tenantId, requestId, approveRequestDto.virtualTruckId);
  }
}
