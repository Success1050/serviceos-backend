export declare enum DuplicateRule {
    SKIP = "SKIP",
    UPDATE = "UPDATE",
    CREATE_NEW = "CREATE_NEW"
}
export declare class ExecuteImportDto {
    rows: Record<string, any>[];
    mapping: Record<string, string>;
    duplicateRule: DuplicateRule;
}
