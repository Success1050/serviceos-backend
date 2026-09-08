import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
export declare class AssetController {
    private readonly assetService;
    constructor(assetService: AssetService);
    create(user: any, createAssetDto: CreateAssetDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AssetStatus;
        tenantId: string;
        customerRecordId: string;
        manufacturer: string | null;
        modelNumber: string | null;
        serialNumber: string | null;
        installDate: Date | null;
        warrantyExpiresAt: Date | null;
        warrantyDocumentUrl: string | null;
    }>;
    findAll(user: any): Promise<({
        customerRecord: {
            name: string;
            address: string | null;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AssetStatus;
        tenantId: string;
        customerRecordId: string;
        manufacturer: string | null;
        modelNumber: string | null;
        serialNumber: string | null;
        installDate: Date | null;
        warrantyExpiresAt: Date | null;
        warrantyDocumentUrl: string | null;
    })[]>;
}
