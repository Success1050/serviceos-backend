import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SettleJobDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  overrideCommissionRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  forcedGrossAmount?: number;
}
