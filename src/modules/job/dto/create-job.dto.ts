import { IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, IsInt } from 'class-validator';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  customerRecordId: string;

  @IsOptional()
  @IsUUID()
  quoteId?: string;

  @IsOptional()
  @IsUUID()
  assignedTechnicianId?: string;

  @IsOptional()
  scheduledAt?: string;

  @IsOptional()
  @IsInt()
  estimatedDuration?: number;
}
