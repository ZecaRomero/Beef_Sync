import { readExcelFileDetailed } from '@/lib/import/excelReader';
import { sanitizeRow } from '@/lib/import/sanitizer';
import { validateColumns, validateRowsWithSchema } from '@/lib/import/validator';
import { detectDuplicates } from '@/lib/import/duplicateChecker';
import type {
  ImportErrorDetail,
  ImportPreviewRow,
  ParsedRow,
  ProcessImportConfig,
  ProcessImportResult,
  RowData,
} from '@/types/importTypes';
import type { z } from 'zod';

interface ProcessExcelParams<TSchema extends z.ZodTypeAny> {
  file: Buffer | string;
  config: ProcessImportConfig<TSchema>;
}

function createPreviewRows<T extends RowData>(
  rows: Array<ParsedRow<T>>,
  allErrors: ImportErrorDetail[]
): ImportPreviewRow[] {
  const errorMap = new Map<string, string[]>();

  allErrors.forEach((err) => {
    const key = `${err.row}:${err.column}`;
    if (!errorMap.has(key)) {
      errorMap.set(key, []);
    }
    errorMap.get(key)?.push(err.error);
  });

  return rows.map(({ rowNumber, row }) => {
    const cells = Object.keys(row).reduce((acc, column) => {
      const key = `${rowNumber}:${column}`;
      const errors = errorMap.get(key) ?? [];

      acc[column] = {
        value: row[column],
        hasError: errors.length > 0,
        errors,
      };
      return acc;
    }, {} as ImportPreviewRow['cells']);

    const rowHasErrors = Object.values(cells).some((cell) => cell.hasError);

    return {
      rowNumber,
      cells,
      isValid: !rowHasErrors,
    };
  });
}

export async function processExcelImport<TSchema extends z.ZodTypeAny>({
  file,
  config,
}: ProcessExcelParams<TSchema>): Promise<ProcessImportResult<RowData>> {
  const excel = readExcelFileDetailed<RowData>(file);
  const columnValidation = validateColumns(excel.headers, config.expectedColumns);

  const sanitizedRows = excel.rows.map((item) => ({
    rowNumber: item.rowNumber,
    row: sanitizeRow(item.row, config.normalizeConfig),
  }));

  const schemaResult = validateRowsWithSchema(sanitizedRows, config.schema);
  const duplicateResult = config.uniqueBy
    ? await detectDuplicates(schemaResult.validRows, {
        uniqueBy: config.uniqueBy,
        checkDuplicatesAgainstDatabase: config.checkDuplicatesAgainstDatabase,
      })
    : {
        duplicatesInFile: [],
        duplicatesInDatabase: [],
        duplicateKeys: new Set<string>(),
      };

  const columnErrors: ImportErrorDetail[] = columnValidation.missingColumns.map((column) => ({
    row: 1,
    column,
    value: null,
    error: `Coluna obrigatória ausente: ${column}`,
  }));

  const duplicateErrors: ImportErrorDetail[] = [
    ...duplicateResult.duplicatesInFile,
    ...duplicateResult.duplicatesInDatabase,
  ].map((item) => ({
    row: item.row,
    column: item.column,
    value: item.value,
    error: item.error,
  }));

  const allErrors = [...columnErrors, ...schemaResult.errors, ...duplicateErrors];
  const invalidRowNumbers = new Set<number>(allErrors.map((err) => err.row));

  const allRows = schemaResult.allRows;
  const validRows = allRows.filter((item) => !invalidRowNumbers.has(item.rowNumber));
  const invalidRows = allRows.filter((item) => invalidRowNumbers.has(item.rowNumber));
  const previewRows = createPreviewRows(allRows as Array<ParsedRow<RowData>>, allErrors);

  return {
    validRows,
    invalidRows,
    previewRows,
    report: {
      totalRows: allRows.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      errors: allErrors,
      duplicates: [
        ...duplicateResult.duplicatesInFile,
        ...duplicateResult.duplicatesInDatabase,
      ],
    },
    columnValidation,
    allRows,
  };
}
