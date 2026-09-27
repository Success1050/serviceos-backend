export declare class InitialTechDocumentDto {
    documentType: string;
    fileName: string;
    fileUrl: string;
    mimeType?: string;
    fileSizeBytes?: number;
    notes?: string;
}
export declare class CreateOverTheDeskTechDto {
    firstName: string;
    lastName: string;
    phone: string;
    tradeSpecialty?: string;
    customCommissionRate?: number;
    hourlyRate?: number;
    departmentId?: string;
    managerEndorsementNotes?: string;
    documents?: InitialTechDocumentDto[];
}
