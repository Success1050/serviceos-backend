import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SupportTicketTypeEnum, TicketPriorityEnum, DisputeReasonEnum } from './create-customer-ticket.dto';

export class CreateStaffTicketDto {
  @IsUUID()
  @IsNotEmpty()
  customerRecordId: string;

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

  @IsOptional()
  @IsUUID()
  assignedStaffId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  disputedAmount?: number;

  @IsOptional()
  @IsEnum(DisputeReasonEnum)
  disputeReason?: DisputeReasonEnum;
}
