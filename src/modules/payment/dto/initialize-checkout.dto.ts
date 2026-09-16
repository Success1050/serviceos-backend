import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class InitializeCheckoutDto {
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @IsString()
  @IsOptional()
  callbackUrl?: string;
}

export class CreateMilestoneInvoiceDto {
  @IsString()
  @IsNotEmpty()
  milestoneId: string;

  @IsNumber()
  @IsOptional()
  dueInDays?: number;
}
