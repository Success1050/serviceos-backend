import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  customerRecordId: string;

  @IsString()
  @IsOptional()
  quoteId?: string;

  @IsString()
  @IsOptional()
  assignedTechnicianId?: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}
