import type { z } from 'zod';

export type ExcelPrimitive = string | number | boolean | Date | null | undefined;
export type RowData = Record<string, ExcelPrimitive | Record<string, unknown> | unknown[]>;

export interface ParsedRow<T extends RowData = RowData> {
  rowNumber: number;
  row: T;
}

export interface ReadExcelOptions {
  sheetIndex?: number;
  sheetName?: string;
  dateNF?: string;
}

export interface ImportErrorDetail {
  row: number;
  column: string;
  value: unknown;
  error: string;
}

export interface ImportDuplicate {
  row: number;
  key: string;
  source: 'file' | 'database';
  column: string;
  value: unknown;
  error: string;
}

export interface ColumnValidationResult {
  isValid: boolean;
  missingColumns: string[];
  unexpectedColumns: string[];
  normalizedHeaders: string[];
}

export interface DuplicateDetectionResult<T extends RowData = RowData> {
  duplicatesInFile: ImportDuplicate[];
  duplicatesInDatabase: ImportDuplicate[];
  duplicateKeys: Set<string>;
  rows: Array<ParsedRow<T>>;
}

export interface NormalizeConfig {
  uppercaseFields?: string[];
  lowercaseFields?: string[];
  dateFields?: string[];
  keepLineBreaksInFields?: string[];
  removeInvalidChars?: boolean;
}

export interface ProcessImportConfig<TSchema extends z.ZodTypeAny> {
  expectedColumns: string[];
  schema: TSchema;
  normalizeConfig?: NormalizeConfig;
  uniqueBy?: string[] | ((row: RowData) => string);
  checkDuplicatesAgainstDatabase?: (rows: Array<ParsedRow<RowData>>) => Promise<Set<string> | string[]>;
}

export interface ImportPreviewCell {
  value: unknown;
  hasError: boolean;
  errors: string[];
}

export interface ImportPreviewRow {
  rowNumber: number;
  cells: Record<string, ImportPreviewCell>;
  isValid: boolean;
}

export interface ImportReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ImportErrorDetail[];
  duplicates: ImportDuplicate[];
}

export interface ProcessImportResult<T extends RowData = RowData> {
  validRows: Array<ParsedRow<T>>;
  invalidRows: Array<ParsedRow<T>>;
  previewRows: ImportPreviewRow[];
  report: ImportReport;
  columnValidation: ColumnValidationResult;
  allRows: Array<ParsedRow<T>>;
}
