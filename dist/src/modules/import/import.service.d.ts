import { PrismaService } from '../../core/prisma/prisma.service';
import { AnalyzeImportDto } from './dto/analyze-import.dto';
import { PreviewImportDto } from './dto/preview-import.dto';
import { ExecuteImportDto } from './dto/execute-import.dto';
export declare class ImportService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    analyzeColumns(analyzeDto: AnalyzeImportDto): {
        headers: string[];
        suggestedMapping: Record<string, string>;
        rowCount: number;
    };
    private normalizePhone;
    previewImport(tenantId: string, previewDto: PreviewImportDto): Promise<{
        metrics: {
            totalProcessed: number;
            validCount: number;
            duplicateCount: number;
            invalidCount: number;
        };
        valid: any[];
        duplicates: any[];
        invalid: any[];
    }>;
    executeImport(tenantId: string, executeDto: ExecuteImportDto): Promise<{
        message: string;
        created: number;
        updated: number;
        skipped: number;
        invalid: number;
    }>;
}
