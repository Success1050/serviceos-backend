import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';
import { SubscriptionTier, ServiceModule } from '@prisma/client';

export class UpdatePlanDto {
  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(SubscriptionTier)
  @IsOptional()
  tier?: SubscriptionTier;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceMonthly?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceAnnual?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxSeats?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxTechnicians?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxBranches?: number;

  @IsArray()
  @IsEnum(ServiceModule, { each: true })
  @IsOptional()
  enabledModules?: ServiceModule[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
