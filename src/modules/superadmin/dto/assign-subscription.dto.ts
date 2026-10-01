import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
} from 'class-validator';
import { BillingCycle, SubscriptionStatus, ServiceModule } from '@prisma/client';

export class AssignSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsNumber()
  @Min(1)
  @IsOptional()
  customSeatQuota?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  customTechnicianQuota?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  customBranchQuota?: number;

  @IsArray()
  @IsEnum(ServiceModule, { each: true })
  @IsOptional()
  additionalModules?: ServiceModule[];

  @IsArray()
  @IsEnum(ServiceModule, { each: true })
  @IsOptional()
  disabledModules?: ServiceModule[];
}
