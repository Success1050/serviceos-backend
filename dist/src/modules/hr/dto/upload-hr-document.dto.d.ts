export declare enum HrDocumentTypeEnum {
    NATIONAL_ID = "NATIONAL_ID",
    GOVERNMENT_PHOTO_ID = "GOVERNMENT_PHOTO_ID",
    TECH_LIVE_PHOTO = "TECH_LIVE_PHOTO",
    TRADE_CERTIFICATION = "TRADE_CERTIFICATION",
    RESUME_CV = "RESUME_CV",
    CONTRACT_DISCLOSURE = "CONTRACT_DISCLOSURE",
    OTHER = "OTHER"
}
export declare class UploadHrDocumentDto {
    documentType: HrDocumentTypeEnum;
    fileName: string;
    fileUrl: string;
    fileSizeBytes?: number;
    mimeType?: string;
    notes?: string;
}
