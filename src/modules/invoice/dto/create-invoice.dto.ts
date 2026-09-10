import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  customerRecordId: string;

  @IsString()
  @IsOptional()
  jobId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
