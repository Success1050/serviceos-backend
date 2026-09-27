import { SupportTicketStatusEnum } from './filter-tickets.dto';
import { TicketPriorityEnum } from './create-customer-ticket.dto';
export declare class UpdateTicketStatusDto {
    status?: SupportTicketStatusEnum;
    priority?: TicketPriorityEnum;
    assignedStaffId?: string;
    resolutionNotes?: string;
}
