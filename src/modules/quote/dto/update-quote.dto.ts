import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMilestoneItemDto } from './create-quote.dto';
import { QuoteStatus } from '@prisma/client';

export class UpdateQuoteDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  customerRecordId?: string;

  @IsEnum(['FIXED', 'AUTH_AND_CAPTURE', 'MILESTONE'])
  @IsOptional()
  billingType?: 'FIXED' | 'AUTH_AND_CAPTURE' | 'MILESTONE';

  @IsEnum(QuoteStatus)
  @IsOptional()
  status?: QuoteStatus;

  @IsString()
  @IsOptional()
  termsAndConditions?: string;

  @IsArray()
  @IsOptional()
  items?: any[];

  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @IsNumber()
  @IsOptional()
  taxAmount?: number;

  @IsString()
  @IsOptional()
  validUntil?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMilestoneItemDto)
  milestones?: CreateMilestoneItemDto[];
}

