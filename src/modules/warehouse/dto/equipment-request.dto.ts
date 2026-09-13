import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class EquipmentRequestDto {
  @IsNotEmpty()
  @IsUUID()
  hqWarehouseId: string;

  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}
