import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMilestoneItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsNotEmpty()
  percentage: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  dueDate?: string;
}

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  customerRecordId: string;

  @IsEnum(['FIXED', 'AUTH_AND_CAPTURE', 'MILESTONE'])
  @IsOptional()
  billingType?: 'FIXED' | 'AUTH_AND_CAPTURE' | 'MILESTONE';

  @IsString()
  @IsOptional()
  termsAndConditions?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMilestoneItemDto)
  milestones?: CreateMilestoneItemDto[];
}
