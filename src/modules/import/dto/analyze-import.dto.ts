import { IsArray, IsNotEmpty } from 'class-validator';

export class AnalyzeImportDto {
  @IsArray()
  @IsNotEmpty()
  rows: Record<string, any>[];
}
