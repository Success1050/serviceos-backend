import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { EquipmentRequestDto } from './dto/equipment-request.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
export declare class WarehouseController {
    private readonly warehouseService;
    constructor(warehouseService: WarehouseService);
    createWarehouse(createWarehouseDto: CreateWarehouseDto, user: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        assignedTechnicianId: string | null;
        type: import("@prisma/client").$Enums.WarehouseType;
    }>;
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
