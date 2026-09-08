import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
export declare class AssetService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createAsset(tenantId: string, createAssetDto: CreateAssetDto): Promise<{
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
    getAssets(tenantId: string): Promise<({
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
