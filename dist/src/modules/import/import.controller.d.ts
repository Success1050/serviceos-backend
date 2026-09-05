import { ImportService } from './import.service';
import { AnalyzeImportDto } from './dto/analyze-import.dto';
import { PreviewImportDto } from './dto/preview-import.dto';
import { ExecuteImportDto } from './dto/execute-import.dto';
export declare class ImportController {
    private readonly importService;
    constructor(importService: ImportService);
    analyze(analyzeDto: AnalyzeImportDto): {
        headers: string[];
        suggestedMapping: Record<string, string>;
        rowCount: number;
    };
    preview(user: any, previewDto: PreviewImportDto): Promise<{
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
    execute(user: any, executeDto: ExecuteImportDto): Promise<{
        message: string;
        created: number;
        updated: number;
        skipped: number;
        invalid: number;
    }>;
}
