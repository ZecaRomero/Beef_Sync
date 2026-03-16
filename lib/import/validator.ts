import { z } from 'zod';
import type {
  ColumnValidationResult,
  ImportErrorDetail,
  ParsedRow,
  RowData,
} from '@/types/importTypes';

function normalizeColumnName(value: string): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, ' ')
    .trim();
}

export function validateColumns(
  headers: string[],
  expectedColumns: string[]
): ColumnValidationResult {
  const normalizedHeaders = headers.map(normalizeColumnName).filter(Boolean);
  const expected = expectedColumns.map(normalizeColumnName).filter(Boolean);

  const headerSet = new Set(normalizedHeaders);
  const expectedSet = new Set(expected);

  const missingColumns = expected.filter((column) => !headerSet.has(column));
  const unexpectedColumns = normalizedHeaders.filter((column) => !expectedSet.has(column));

  return {
    isValid: missingColumns.length === 0,
    missingColumns,
    unexpectedColumns,
    normalizedHeaders,
  };
}

export function validateRowsWithSchema<T extends z.ZodTypeAny>(
  rows: Array<ParsedRow<RowData>>,
  schema: T
): {
  validRows: Array<ParsedRow<RowData>>;
  invalidRows: Array<ParsedRow<RowData>>;
  errors: ImportErrorDetail[];
  allRows: Array<ParsedRow<RowData>>;
} {
  const validRows: Array<ParsedRow<RowData>> = [];
  const invalidRows: Array<ParsedRow<RowData>> = [];
  const errors: ImportErrorDetail[] = [];
  const allRows: Array<ParsedRow<RowData>> = [];

  rows.forEach(({ rowNumber, row }) => {
    const parseResult = schema.safeParse(row);
    if (parseResult.success) {
      const parsedRow = { rowNumber, row: parseResult.data as RowData };
      validRows.push(parsedRow);
      allRows.push(parsedRow);
      return;
    }

    parseResult.error.issues.forEach((issue) => {
      const column = issue.path.length > 0 ? issue.path.join('.') : '_row';
      const rootColumn = issue.path[0] ? String(issue.path[0]) : '';
      const value =
        rootColumn && row && Object.prototype.hasOwnProperty.call(row, rootColumn)
          ? row[rootColumn]
          : row;

      errors.push({
        row: rowNumber,
        column,
        value,
        error: issue.message,
      });
    });

    const parsedRow = { rowNumber, row: row as RowData };
    invalidRows.push(parsedRow);
    allRows.push(parsedRow);
  });

  return {
    validRows,
    invalidRows,
    errors,
    allRows,
  };
}
