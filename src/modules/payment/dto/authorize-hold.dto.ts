import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AuthorizeHoldDto {
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @IsNumber()
  @IsOptional()
  amount?: number; // If omitted, defaults to quote or job amount

  @IsString()
  @IsOptional()
  paymentMethodToken?: string;
}
