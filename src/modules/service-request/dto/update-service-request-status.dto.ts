import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ServiceRequestStatus } from '@prisma/client';

export class UpdateServiceRequestStatusDto {
  @IsEnum(ServiceRequestStatus)
  @IsNotEmpty()
  status: ServiceRequestStatus;

  @IsString()
  @IsOptional()
  jobId?: string;
}
