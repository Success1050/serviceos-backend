import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ApproveExpenseDto {
  @IsOptional()
  @IsBoolean()
  billToClient?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectExpenseDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
