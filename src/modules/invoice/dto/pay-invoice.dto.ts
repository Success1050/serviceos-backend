import { IsOptional, IsString } from 'class-validator';

export class PayInvoiceDto {
  @IsString()
  @IsOptional()
  gateway?: 'PAYSTACK' | 'STRIPE';

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  callbackUrl?: string;
}
