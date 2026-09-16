import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { EquipmentRequestDto } from './dto/equipment-request.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { AddStockDto } from './dto/add-stock.dto';
export declare class WarehouseController {
    private readonly warehouseService;
    constructor(warehouseService: WarehouseService);
    getWarehouses(user: any): Promise<({
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
    createWarehouse(createWarehouseDto: CreateWarehouseDto, user: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        assignedTechnicianId: string | null;
        type: import("@prisma/client").$Enums.WarehouseType;
    }>;
    getWarehouseInventory(warehouseId: string, user: any): Promise<({
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
    addStock(warehouseId: string, addStockDto: AddStockDto, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        quantity: number;
        warehouseId: string;
    }>;
    getProducts(user: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal | null;
    }[]>;
    createProduct(createProductDto: CreateProductDto, user: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    getEquipmentRequests(status: string, user: any): Promise<({
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
    createEquipmentRequest(equipmentRequestDto: EquipmentRequestDto, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.RequestStatus;
        tenantId: string;
        hqWarehouseId: string;
        productId: string;
        quantity: number;
    }>;
    approveRequest(requestId: string, approveRequestDto: ApproveRequestDto, user: any): Promise<{
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
