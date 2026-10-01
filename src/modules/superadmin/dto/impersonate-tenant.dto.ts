import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ImpersonateTenantDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  targetUserId?: string;
}
