import { WarehouseType } from '@prisma/client';
export declare class CreateWarehouseDto {
    name: string;
    type: WarehouseType;
    assignedTechnicianId?: string;
}
