import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
} from 'class-validator';
import { SubscriptionTier, ServiceModule } from '@prisma/client';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(SubscriptionTier)
  @IsOptional()
  tier?: SubscriptionTier;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  priceMonthly: number;

  @IsNumber()
  @Min(0)
  priceAnnual: number;

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
  enabledModules: ServiceModule[];
}
