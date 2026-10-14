import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { AssetStatus } from '@prisma/client';

export class UpdateAssetDto {
  @IsString()
  @IsOptional()
  name?: string;

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

  @IsDateString()
  @IsOptional()
  warrantyExpiresAt?: string;

  @IsString()
  @IsOptional()
  warrantyDocumentUrl?: string;

  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @IsString()
  @IsOptional()
  customerRecordId?: string;
}
