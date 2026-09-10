import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateServiceRequestDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  assetId?: string;
}
