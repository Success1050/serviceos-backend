import { IsString, IsNotEmpty } from 'class-validator';

export class RequestTechPinDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}
