import type {
  DuplicateDetectionResult,
  ImportDuplicate,
  ParsedRow,
  RowData,
} from '@/types/importTypes';

interface DuplicateOptions<T extends RowData> {
  uniqueBy: string[] | ((row: T) => string);
  checkDuplicatesAgainstDatabase?: (rows: Array<ParsedRow<T>>) => Promise<Set<string> | string[]>;
}

function buildUniqueKey<T extends RowData>(
  row: T,
  uniqueBy: string[] | ((row: T) => string)
): string {
  if (typeof uniqueBy === 'function') {
    return uniqueBy(row);
  }

  return uniqueBy
    .map((field) => {
      const value = row[field];
      return String(value ?? '')
        .trim()
        .toLowerCase();
    })
    .join('|');
}

function buildDuplicate(
  rowNumber: number,
  key: string,
  source: 'file' | 'database',
  uniqueBy: string[] | ((row: RowData) => string),
  row: RowData
): ImportDuplicate {
  const firstColumn = Array.isArray(uniqueBy) && uniqueBy.length ? uniqueBy[0] : '_key';
  return {
    row: rowNumber,
    key,
    source,
    column: firstColumn,
    value: row[firstColumn],
    error:
      source === 'file'
        ? 'Registro duplicado no arquivo enviado'
        : 'Registro já existente no banco de dados',
  };
}

export async function detectDuplicates<T extends RowData>(
  rows: Array<ParsedRow<T>>,
  options: DuplicateOptions<T>
): Promise<DuplicateDetectionResult<T>> {
  const seen = new Map<string, number>();
  const duplicatesInFile: ImportDuplicate[] = [];
  const duplicateKeys = new Set<string>();

  rows.forEach(({ rowNumber, row }) => {
    const key = buildUniqueKey(row, options.uniqueBy);
    if (!key) return;

    if (seen.has(key)) {
      duplicateKeys.add(key);
      duplicatesInFile.push(
        buildDuplicate(rowNumber, key, 'file', options.uniqueBy as string[] | ((row: RowData) => string), row)
      );
      return;
    }

    seen.set(key, rowNumber);
  });

  let duplicatesInDatabase: ImportDuplicate[] = [];
  if (options.checkDuplicatesAgainstDatabase) {
    const dbDuplicatesRaw = await options.checkDuplicatesAgainstDatabase(rows);
    const dbKeys = new Set(Array.from(dbDuplicatesRaw));

    duplicatesInDatabase = rows
      .filter(({ row }) => dbKeys.has(buildUniqueKey(row, options.uniqueBy)))
      .map(({ rowNumber, row }) =>
        buildDuplicate(
          rowNumber,
          buildUniqueKey(row, options.uniqueBy),
          'database',
          options.uniqueBy as string[] | ((row: RowData) => string),
          row
        )
      );

    duplicatesInDatabase.forEach((duplicate) => duplicateKeys.add(duplicate.key));
  }

  return {
    duplicatesInFile,
    duplicatesInDatabase,
    duplicateKeys,
    rows,
  };
}
