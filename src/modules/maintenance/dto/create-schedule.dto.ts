import { IsNotEmpty, IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateMaintenanceScheduleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @IsNotEmpty()
  intervalMonths: number;

  @IsDateString()
  @IsNotEmpty()
  firstDueDate: string;

  @IsString()
  @IsOptional()
  assetId?: string;
}
