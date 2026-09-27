export declare enum ProxyVerificationStatusEnum {
    NOT_REQUIRED = "NOT_REQUIRED",
    PENDING_HQ_REVIEW = "PENDING_HQ_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare class FilterTechniciansDto {
    search?: string;
    proxyVerificationStatus?: ProxyVerificationStatusEnum;
    termsAcknowledged?: boolean;
    departmentId?: string;
    page?: number;
    limit?: number;
}
