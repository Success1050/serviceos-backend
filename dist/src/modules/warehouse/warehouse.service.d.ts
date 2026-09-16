import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { EquipmentRequestDto } from './dto/equipment-request.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { AddStockDto } from './dto/add-stock.dto';
export declare class WarehouseService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createWarehouse(tenantId: string, data: CreateWarehouseDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        assignedTechnicianId: string | null;
        type: import("@prisma/client").$Enums.WarehouseType;
    }>;
    getWarehouses(tenantId: string): Promise<({
        _count: {
            inventoryItems: number;
        };
        assignedTechnician: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        assignedTechnicianId: string | null;
        type: import("@prisma/client").$Enums.WarehouseType;
    })[]>;
    getWarehouseInventory(tenantId: string, warehouseId: string): Promise<({
        product: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            sku: string | null;
            price: import("@prisma/client/runtime/library").Decimal | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        quantity: number;
        warehouseId: string;
    })[]>;
    createProduct(tenantId: string, data: CreateProductDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    getProducts(tenantId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal | null;
    }[]>;
    addStock(tenantId: string, warehouseId: string, data: AddStockDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        quantity: number;
        warehouseId: string;
    }>;
    createEquipmentRequest(tenantId: string, data: EquipmentRequestDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.RequestStatus;
        tenantId: string;
        hqWarehouseId: string;
        productId: string;
        quantity: number;
    }>;
    getEquipmentRequests(tenantId: string, status?: any): Promise<({
        tenant: {
            name: string;
            id: string;
        };
        product: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            sku: string | null;
            price: import("@prisma/client/runtime/library").Decimal | null;
        };
        hqWarehouse: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.RequestStatus;
        tenantId: string;
        hqWarehouseId: string;
        productId: string;
        quantity: number;
    })[]>;
    approveEquipmentRequest(tenantId: string, requestId: string, virtualTruckId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.RequestStatus;
        tenantId: string;
        hqWarehouseId: string;
        productId: string;
        quantity: number;
    }>;
}
