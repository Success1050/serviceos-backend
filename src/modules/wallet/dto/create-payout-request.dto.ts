import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePayoutRequestDto {
  @IsString()
  @IsNotEmpty()
  bankDetailId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(100, { message: 'Minimum payout amount is ₦100.00' })
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'NGN';
}
