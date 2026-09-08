import { IsOptional, IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsObject()
  businessProfile?: Record<string, any>;

  @IsOptional()
  @IsObject()
  branding?: Record<string, any>;

  @IsOptional()
  @IsObject()
  portal?: Record<string, any>;

  @IsOptional()
  @IsObject()
  quotes?: Record<string, any>;

  @IsOptional()
  @IsObject()
  invoices?: Record<string, any>;

  @IsOptional()
  @IsObject()
  payments?: Record<string, any>;

  @IsOptional()
  @IsObject()
  notifications?: Record<string, any>;

  @IsOptional()
  @IsObject()
  scheduling?: Record<string, any>;

  @IsOptional()
  @IsObject()
  technicians?: Record<string, any>;

  @IsOptional()
  lockedSettings?: string[];
}
