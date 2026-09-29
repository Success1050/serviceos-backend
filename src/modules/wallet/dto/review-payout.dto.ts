import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ReviewPayoutDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reviewNotes?: string;
}

export class RejectPayoutDto {
  @IsString()
  @MaxLength(500)
  reason: string;
}
