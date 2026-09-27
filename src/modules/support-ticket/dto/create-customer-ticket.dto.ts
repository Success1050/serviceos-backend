import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum SupportTicketTypeEnum {
  WARRANTY_CLAIM = 'WARRANTY_CLAIM',
  BILLING_DISPUTE = 'BILLING_DISPUTE',
  SERVICE_COMPLAINT = 'SERVICE_COMPLAINT',
  GENERAL_INQUIRY = 'GENERAL_INQUIRY',
}

export enum TicketPriorityEnum {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum DisputeReasonEnum {
  OVERCHARGED = 'OVERCHARGED',
  UNAUTHORIZED_FEE = 'UNAUTHORIZED_FEE',
  WORK_NOT_COMPLETED = 'WORK_NOT_COMPLETED',
  POOR_WORKMANSHIP = 'POOR_WORKMANSHIP',
  DOUBLE_CHARGED = 'DOUBLE_CHARGED',
  WARRANTY_DENIAL = 'WARRANTY_DENIAL',
  OTHER = 'OTHER',
}

export class CreateCustomerTicketDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(SupportTicketTypeEnum)
  type: SupportTicketTypeEnum;

  @IsOptional()
  @IsEnum(TicketPriorityEnum)
  priority?: TicketPriorityEnum;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  // Optional contextual entity links
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @IsOptional()
  @IsUUID()
  paymentTransactionId?: string;

  @IsOptional()
  @IsUUID()
  jobId?: string;

  // Dispute specific fields
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  disputedAmount?: number;

  @IsOptional()
  @IsEnum(DisputeReasonEnum)
  disputeReason?: DisputeReasonEnum;
}
