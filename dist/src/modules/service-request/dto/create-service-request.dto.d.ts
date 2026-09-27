export declare enum UrgencyLevelDto {
    LOW = "LOW",
    NORMAL = "NORMAL",
    URGENT = "URGENT",
    EMERGENCY = "EMERGENCY"
}
export declare class CreateServiceRequestDto {
    description: string;
    assetId?: string;
    urgency?: UrgencyLevelDto;
    preferredDate?: string;
    preferredTimeSlot?: string;
    attachments?: string[];
}
