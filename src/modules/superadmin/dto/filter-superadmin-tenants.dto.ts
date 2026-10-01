import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SubscriptionTier } from '@prisma/client';

export class FilterSuperAdminTenantsDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(SubscriptionTier)
  @IsOptional()
  planTier?: SubscriptionTier;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isSuspended?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isParentOnly?: boolean;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;
}
