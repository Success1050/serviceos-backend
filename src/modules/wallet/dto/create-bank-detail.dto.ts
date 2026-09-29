import { IsString, IsNotEmpty, Length, Matches, IsOptional, IsBoolean } from 'class-validator';

export class CreateBankDetailDto {
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 10, { message: 'Account number must be exactly 10 digits' })
  @Matches(/^\d+$/, { message: 'Account number must contain only digits' })
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
