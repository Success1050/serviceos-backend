import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class CreateExpenseDto {
  @IsNotEmpty()
  @IsUUID()
  jobId: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  receiptPhotoUrl: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @IsOptional()
  @IsBoolean()
  billToClient?: boolean;
}
