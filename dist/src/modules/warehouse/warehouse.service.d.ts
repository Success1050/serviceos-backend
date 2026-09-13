import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { EquipmentRequestDto } from './dto/equipment-request.dto';
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
