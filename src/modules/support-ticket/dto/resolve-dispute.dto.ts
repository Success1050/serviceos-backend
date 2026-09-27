import { IsEnum, IsNotEmpty, IsString, IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum DisputeResolutionActionEnum {
  UPHOLD_CHARGE = 'UPHOLD_CHARGE',
  PARTIAL_CREDIT = 'PARTIAL_CREDIT',
  FULL_REFUND = 'FULL_REFUND',
  VOID_INVOICE = 'VOID_INVOICE',
}

export class ResolveDisputeDto {
  @IsEnum(DisputeResolutionActionEnum)
  @IsNotEmpty()
  action: DisputeResolutionActionEnum;

  @IsString()
  @IsNotEmpty()
  resolutionNotes: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  adjustedAmount?: number;

  @IsOptional()
  @IsBoolean()
  executeGatewayRefund?: boolean = false;
}
