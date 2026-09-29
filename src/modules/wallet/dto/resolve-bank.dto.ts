import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class ResolveBankDto {
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 10, { message: 'NUBAN account number must be exactly 10 digits' })
  @Matches(/^\d+$/, { message: 'Account number must contain only digits' })
  accountNumber: string;
}
