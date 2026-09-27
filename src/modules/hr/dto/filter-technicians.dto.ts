import { IsOptional, IsEnum, IsString, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum ProxyVerificationStatusEnum {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING_HQ_REVIEW = 'PENDING_HQ_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class FilterTechniciansDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProxyVerificationStatusEnum)
  proxyVerificationStatus?: ProxyVerificationStatusEnum;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  termsAcknowledged?: boolean;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
