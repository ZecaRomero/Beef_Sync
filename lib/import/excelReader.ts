import fs from 'fs';
import * as XLSX from 'xlsx';
import type { ParsedRow, ReadExcelOptions, RowData } from '@/types/importTypes';

type ExcelInput = Buffer | string;

export interface ReadExcelResult<T extends RowData = RowData> {
  sheetName: string;
  headers: string[];
  rows: Array<ParsedRow<T>>;
}

function normalizeHeader(header: unknown): string {
  return String(header ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

function getWorkbook(file: ExcelInput): XLSX.WorkBook {
  if (Buffer.isBuffer(file)) {
    return XLSX.read(file, {
      type: 'buffer',
      raw: true,
      cellDates: true,
    });
  }

  if (typeof file === 'string' && fs.existsSync(file)) {
    return XLSX.readFile(file, {
      raw: true,
      cellDates: true,
    });
  }

  throw new Error('Arquivo Excel inválido: envie Buffer ou caminho válido.');
}

export function readExcelFile<T extends RowData = RowData>(
  file: ExcelInput,
  options: ReadExcelOptions = {}
): Array<ParsedRow<T>> {
  return readExcelFileDetailed<T>(file, options).rows;
}

export function readExcelFileDetailed<T extends RowData = RowData>(
  file: ExcelInput,
  options: ReadExcelOptions = {}
): ReadExcelResult<T> {
  const workbook = getWorkbook(file);
  const { sheetName, sheetIndex = 0 } = options;
  const selectedSheetName = sheetName || workbook.SheetNames[sheetIndex];

  if (!selectedSheetName) {
    throw new Error('Nenhuma planilha encontrada no arquivo.');
  }

  const worksheet = workbook.Sheets[selectedSheetName];
  if (!worksheet) {
    throw new Error(`A planilha "${selectedSheetName}" não foi encontrada.`);
  }

  const aoa = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    raw: true,
    dateNF: options.dateNF ?? 'yyyy-mm-dd',
    blankrows: false,
  }) as unknown[][];

  if (!aoa.length) {
    return {
      sheetName: selectedSheetName,
      headers: [],
      rows: [],
    };
  }

  const headers = (aoa[0] ?? []).map(normalizeHeader);
  const rows = aoa.slice(1).map((line, index) => {
    const row = headers.reduce((acc, header, colIndex) => {
      if (!header) return acc;
      acc[header] = (line ?? [])[colIndex] as unknown;
      return acc;
    }, {} as Record<string, unknown>);

    return {
      rowNumber: index + 2,
      row: row as T,
    };
  });

  return {
    sheetName: selectedSheetName,
    headers,
    rows,
  };
}
