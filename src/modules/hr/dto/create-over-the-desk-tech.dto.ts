import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InitialTechDocumentDto {
  @IsString()
  @IsNotEmpty()
  documentType: string; // e.g. "GOVERNMENT_PHOTO_ID", "TECH_LIVE_PHOTO", "TRADE_CERTIFICATION"

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fileSizeBytes?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOverTheDeskTechDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  tradeSpecialty?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  customCommissionRate?: number; // e.g. 15.00 for 15%

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsString()
  managerEndorsementNotes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InitialTechDocumentDto)
  documents?: InitialTechDocumentDto[];
}
