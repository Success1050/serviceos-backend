import { SupportTicketTypeEnum, TicketPriorityEnum } from './create-customer-ticket.dto';
export declare enum SupportTicketStatusEnum {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    WAITING_ON_CUSTOMER = "WAITING_ON_CUSTOMER",
    ACTION_REQUIRED = "ACTION_REQUIRED",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED",
    REJECTED = "REJECTED"
}
export declare class FilterTicketsDto {
    status?: SupportTicketStatusEnum;
    type?: SupportTicketTypeEnum;
    priority?: TicketPriorityEnum;
    customerRecordId?: string;
    assignedStaffId?: string;
    search?: string;
    page?: number;
    limit?: number;
}
