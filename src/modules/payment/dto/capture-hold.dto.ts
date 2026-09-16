import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CaptureHoldDto {
  @IsNumber()
  @IsOptional()
  amount?: number; // If omitted, captures full held amount
}

export class ReleaseHoldDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
