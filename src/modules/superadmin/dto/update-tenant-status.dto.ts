import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class UpdateTenantStatusDto {
  @IsBoolean()
  isSuspended: boolean;

  @IsString()
  @IsOptional()
  suspensionReason?: string;

  @IsBoolean()
  @IsOptional()
  cascadeToBranches?: boolean;
}
