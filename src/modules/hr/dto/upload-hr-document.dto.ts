import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum HrDocumentTypeEnum {
  NATIONAL_ID = 'NATIONAL_ID',
  GOVERNMENT_PHOTO_ID = 'GOVERNMENT_PHOTO_ID',
  TECH_LIVE_PHOTO = 'TECH_LIVE_PHOTO',
  TRADE_CERTIFICATION = 'TRADE_CERTIFICATION',
  RESUME_CV = 'RESUME_CV',
  CONTRACT_DISCLOSURE = 'CONTRACT_DISCLOSURE',
  OTHER = 'OTHER',
}

export class UploadHrDocumentDto {
  @IsEnum(HrDocumentTypeEnum)
  documentType: HrDocumentTypeEnum;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fileSizeBytes?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
