import { SupportTicketTypeEnum, TicketPriorityEnum, DisputeReasonEnum } from './create-customer-ticket.dto';
export declare class CreateStaffTicketDto {
    customerRecordId: string;
    subject: string;
    description: string;
    type: SupportTicketTypeEnum;
    priority?: TicketPriorityEnum;
    attachments?: string[];
    assetId?: string;
    invoiceId?: string;
    paymentTransactionId?: string;
    jobId?: string;
    assignedStaffId?: string;
    disputedAmount?: number;
    disputeReason?: DisputeReasonEnum;
}
