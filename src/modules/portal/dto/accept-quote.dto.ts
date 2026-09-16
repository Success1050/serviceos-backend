import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AcceptQuoteDto {
  @IsBoolean()
  @IsNotEmpty()
  acceptedTerms: boolean;

  @IsString()
  @IsNotEmpty()
  signerName: string;

  @IsString()
  @IsNotEmpty()
  signatureData: string; // Base64 signature image or typed legal consent

  @IsString()
  @IsOptional()
  paymentMethodToken?: string; // Optional card token or authorization code to authorize holds
}
