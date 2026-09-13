import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { WarehouseType } from '@prisma/client';

export class CreateWarehouseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(WarehouseType)
  type: WarehouseType;

  @IsOptional()
  @IsUUID()
  assignedTechnicianId?: string;
}
