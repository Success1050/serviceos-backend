export declare class CreateMilestoneItemDto {
    title: string;
    percentage: number;
    amount: number;
    order?: number;
    dueDate?: string;
}
export declare class CreateQuoteDto {
    title: string;
    amount: number;
    customerRecordId: string;
    billingType?: 'FIXED' | 'AUTH_AND_CAPTURE' | 'MILESTONE';
    termsAndConditions?: string;
    milestones?: CreateMilestoneItemDto[];
}
