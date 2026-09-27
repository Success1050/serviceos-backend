import { IsOptional, IsString } from 'class-validator';

export class AcknowledgeTermsDto {
  @IsOptional()
  @IsString()
  termsVersion?: string = 'v1.0-2026';
}
