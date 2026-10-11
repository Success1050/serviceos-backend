import { IsNotEmpty, IsOptional, IsString, Matches, IsNumber, IsBoolean } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsBoolean()
  @IsOptional()
  isHq?: boolean;

  @IsString()
  @IsOptional()
  initialBranchName?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  managerName?: string;

  @IsString()
  @IsOptional()
  managerEmail?: string;
}

