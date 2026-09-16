import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class LogBankTransferDto {
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  bankName: string; // e.g. "Zenith Bank", "GTBank", "Wema Bank"

  @IsString()
  @IsNotEmpty()
  transactionReference: string; // Bank teller number, transfer session ID, or NIBSS ref

  @IsString()
  @IsOptional()
  proofOfPaymentUrl?: string; // Image or PDF receipt from customer

  @IsString()
  @IsOptional()
  notes?: string;
}
