export declare enum DisputeResolutionActionEnum {
    UPHOLD_CHARGE = "UPHOLD_CHARGE",
    PARTIAL_CREDIT = "PARTIAL_CREDIT",
    FULL_REFUND = "FULL_REFUND",
    VOID_INVOICE = "VOID_INVOICE"
}
export declare class ResolveDisputeDto {
    action: DisputeResolutionActionEnum;
    resolutionNotes: string;
    adjustedAmount?: number;
    executeGatewayRefund?: boolean;
}
