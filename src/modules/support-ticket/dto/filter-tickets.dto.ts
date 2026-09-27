import { IsOptional, IsEnum, IsUUID, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SupportTicketTypeEnum, TicketPriorityEnum } from './create-customer-ticket.dto';

export enum SupportTicketStatusEnum {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_ON_CUSTOMER = 'WAITING_ON_CUSTOMER',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export class FilterTicketsDto {
  @IsOptional()
  @IsEnum(SupportTicketStatusEnum)
  status?: SupportTicketStatusEnum;

  @IsOptional()
  @IsEnum(SupportTicketTypeEnum)
  type?: SupportTicketTypeEnum;

  @IsOptional()
  @IsEnum(TicketPriorityEnum)
  priority?: TicketPriorityEnum;

  @IsOptional()
  @IsUUID()
  customerRecordId?: string;

  @IsOptional()
  @IsUUID()
  assignedStaffId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
