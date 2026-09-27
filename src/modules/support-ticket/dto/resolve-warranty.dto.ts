import { IsBoolean, IsNotEmpty, IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class ResolveWarrantyDto {
  @IsBoolean()
  @IsNotEmpty()
  approved: boolean;

  @IsString()
  @IsNotEmpty()
  resolutionNotes: string;

  @IsOptional()
  @IsBoolean()
  autoSpawnReworkJob?: boolean = true;

  @IsOptional()
  @IsDateString()
  reworkScheduledAt?: string;

  @IsOptional()
  @IsUUID()
  assignedTechnicianId?: string;

  @IsOptional()
  @IsString()
  reworkJobTitle?: string;
}
