import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewProxyVerificationDto {
  @IsBoolean()
  @IsNotEmpty()
  approved: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
