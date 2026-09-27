import { IsOptional, IsEnum, IsUUID, IsString } from 'class-validator';
import { SupportTicketStatusEnum } from './filter-tickets.dto';
import { TicketPriorityEnum } from './create-customer-ticket.dto';

export class UpdateTicketStatusDto {
  @IsOptional()
  @IsEnum(SupportTicketStatusEnum)
  status?: SupportTicketStatusEnum;

  @IsOptional()
  @IsEnum(TicketPriorityEnum)
  priority?: TicketPriorityEnum;

  @IsOptional()
  @IsUUID()
  assignedStaffId?: string;

  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}
