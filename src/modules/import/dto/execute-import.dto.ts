import { IsArray, IsEnum, IsNotEmpty, IsObject } from 'class-validator';

export enum DuplicateRule {
  SKIP = 'SKIP',
  UPDATE = 'UPDATE',
  CREATE_NEW = 'CREATE_NEW'
}

export class ExecuteImportDto {
  @IsArray()
  @IsNotEmpty()
  rows: Record<string, any>[];

  @IsObject()
  @IsNotEmpty()
  mapping: Record<string, string>;

  @IsEnum(DuplicateRule)
  @IsNotEmpty()
  duplicateRule: DuplicateRule;
}
