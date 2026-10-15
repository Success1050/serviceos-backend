import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class RecordPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string; // 'BANK_TRANSFER' | 'CASH' | 'POS' | 'CHEQUE'

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsDateString()
  @IsOptional()
  paidAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  tellerSlipUrl?: string;
}
