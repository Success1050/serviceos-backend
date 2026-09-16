import { IsNotEmpty, IsOptional, IsString, IsEnum, IsArray, IsDateString } from 'class-validator';

export enum UrgencyLevelDto {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  URGENT = 'URGENT',
  EMERGENCY = 'EMERGENCY',
}

export class CreateServiceRequestDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  assetId?: string;

  @IsEnum(UrgencyLevelDto)
  @IsOptional()
  urgency?: UrgencyLevelDto;

  @IsDateString()
  @IsOptional()
  preferredDate?: string;

  @IsString()
  @IsOptional()
  preferredTimeSlot?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
