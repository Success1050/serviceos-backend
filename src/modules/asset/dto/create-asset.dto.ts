import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  modelNumber?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsDateString()
  @IsOptional()
  installDate?: string;

  @IsString()
  @IsNotEmpty()
  customerRecordId: string;
}
