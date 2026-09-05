import { IsArray, IsNotEmpty, IsObject } from 'class-validator';

export class PreviewImportDto {
  @IsArray()
  @IsNotEmpty()
  rows: Record<string, any>[];

  @IsObject()
  @IsNotEmpty()
  mapping: Record<string, string>;
}
