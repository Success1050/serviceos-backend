export declare enum SupportTicketTypeEnum {
    WARRANTY_CLAIM = "WARRANTY_CLAIM",
    BILLING_DISPUTE = "BILLING_DISPUTE",
    SERVICE_COMPLAINT = "SERVICE_COMPLAINT",
    GENERAL_INQUIRY = "GENERAL_INQUIRY"
}
export declare enum TicketPriorityEnum {
    LOW = "LOW",
    NORMAL = "NORMAL",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum DisputeReasonEnum {
    OVERCHARGED = "OVERCHARGED",
    UNAUTHORIZED_FEE = "UNAUTHORIZED_FEE",
    WORK_NOT_COMPLETED = "WORK_NOT_COMPLETED",
    POOR_WORKMANSHIP = "POOR_WORKMANSHIP",
    DOUBLE_CHARGED = "DOUBLE_CHARGED",
    WARRANTY_DENIAL = "WARRANTY_DENIAL",
    OTHER = "OTHER"
}
export declare class CreateCustomerTicketDto {
    subject: string;
    description: string;
    type: SupportTicketTypeEnum;
    priority?: TicketPriorityEnum;
    attachments?: string[];
    assetId?: string;
    invoiceId?: string;
    paymentTransactionId?: string;
    jobId?: string;
    disputedAmount?: number;
    disputeReason?: DisputeReasonEnum;
}
