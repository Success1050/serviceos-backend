import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { EquipmentRequestDto } from './dto/equipment-request.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { AddStockDto } from './dto/add-stock.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async createWarehouse(tenantId: string, data: CreateWarehouseDto) {
    return this.prisma.warehouse.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type,
        assignedTechnicianId: data.assignedTechnicianId,
      },
    });
  }

  async getWarehouses(tenantId: string) {
    return this.prisma.warehouse.findMany({
      where: {
        OR: [
          { tenantId },
          { tenant: { parentId: tenantId } },
        ],
      },
      include: {
        assignedTechnician: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { inventoryItems: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWarehouseInventory(tenantId: string, warehouseId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id: warehouseId,
        OR: [
          { tenantId },
          { tenant: { parentId: tenantId } },
        ],
      },
    });

    if (!warehouse) throw new NotFoundException('Warehouse not found');

    return this.prisma.inventoryItem.findMany({
      where: { warehouseId },
      include: {
        product: true,
      },
    });
  }

  async createProduct(tenantId: string, data: CreateProductDto) {
    return this.prisma.productCatalog.create({
      data: {
        tenantId,
        name: data.name,
        sku: data.sku,
        price: data.price,
      },
    });
  }

  async getProducts(tenantId: string) {
    return this.prisma.productCatalog.findMany({
      where: {
        OR: [
          { tenantId },
          { tenant: { parentId: tenantId } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  async addStock(tenantId: string, warehouseId: string, data: AddStockDto) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id: warehouseId,
        OR: [
          { tenantId },
          { tenant: { parentId: tenantId } },
        ],
      },
    });

    if (!warehouse) throw new NotFoundException('Warehouse not found');

    return this.prisma.inventoryItem.upsert({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId: data.productId,
        },
      },
      create: {
        warehouseId,
        productId: data.productId,
        quantity: data.quantity,
      },
      update: {
        quantity: { increment: data.quantity },
      },
    });
  }

  async createEquipmentRequest(tenantId: string, data: EquipmentRequestDto) {
    return this.prisma.equipmentRequest.create({
      data: {
        tenantId,
        hqWarehouseId: data.hqWarehouseId,
        productId: data.productId,
        quantity: data.quantity,
        status: 'PENDING',
      },
    });
  }

  async getEquipmentRequests(tenantId: string, status?: any) {
    const whereClause: any = {
      OR: [
        { tenantId },
        { tenant: { parentId: tenantId } },
        { hqWarehouse: { tenantId } },
      ],
    };

    if (status) {
      whereClause.status = status;
    }

    return this.prisma.equipmentRequest.findMany({
      where: whereClause,
      include: {
        product: true,
        hqWarehouse: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveEquipmentRequest(tenantId: string, requestId: string, virtualTruckId: string) {
    // Check if the request belongs to this tenant or a sub-company of this HQ tenant
    const request = await this.prisma.equipmentRequest.findFirst({
      where: {
        id: requestId,
        OR: [
          { tenantId },
          { tenant: { parentId: tenantId } },
          { hqWarehouse: { tenantId } },
        ],
      },
    });

    if (!request) throw new NotFoundException('Equipment request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('Request is not pending');

    // Perform the inventory transfer in a transaction
    return this.prisma.$transaction(async (prisma) => {
      // 1. Verify Virtual Truck exists and is indeed a VIRTUAL_TRUCK
      const truck = await prisma.warehouse.findFirst({
        where: { id: virtualTruckId, type: 'VIRTUAL_TRUCK' },
      });

      if (!truck) {
        throw new BadRequestException('Target destination must be a valid Virtual Truck warehouse');
      }

      // 2. Mark request as APPROVED
      const approvedRequest = await prisma.equipmentRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });

      // 3. Decrement HQ Inventory
      const hqInventory = await prisma.inventoryItem.findUnique({
        where: { warehouseId_productId: { warehouseId: request.hqWarehouseId, productId: request.productId } },
      });

      if (!hqInventory || hqInventory.quantity < request.quantity) {
        throw new BadRequestException('Insufficient inventory in HQ Warehouse');
      }

      await prisma.inventoryItem.update({
        where: { id: hqInventory.id },
        data: { quantity: { decrement: request.quantity } },
      });

      // 4. Increment Virtual Truck Inventory
      const truckInventory = await prisma.inventoryItem.findUnique({
        where: { warehouseId_productId: { warehouseId: virtualTruckId, productId: request.productId } },
      });

      if (truckInventory) {
        await prisma.inventoryItem.update({
          where: { id: truckInventory.id },
          data: { quantity: { increment: request.quantity } },
        });
      } else {
        await prisma.inventoryItem.create({
          data: {
            warehouseId: virtualTruckId,
            productId: request.productId,
            quantity: request.quantity,
          },
        });
      }

      return approvedRequest;
    });
  }
}
