import { IsNotEmpty, IsUUID } from 'class-validator';

export class ApproveRequestDto {
  @IsNotEmpty()
  @IsUUID()
  virtualTruckId: string;
}
