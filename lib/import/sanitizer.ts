import type { NormalizeConfig, RowData } from '@/types/importTypes';

const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
const COMMON_MOJIBAKE_MAP: Record<string, string> = {
  'Ã¡': 'á',
  'Ã ': 'à',
  'Ã¢': 'â',
  'Ã£': 'ã',
  'Ã§': 'ç',
  'Ã©': 'é',
  'Ãª': 'ê',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ã´': 'ô',
  'Ãµ': 'õ',
  'Ãº': 'ú',
};

function normalizeFieldName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function convertExcelSerialDate(value: number): Date {
  const epoch = new Date(Date.UTC(1899, 11, 30));
  return new Date(epoch.getTime() + value * 86400000);
}

function parseDate(value: unknown): string | unknown {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number' && value > 59 && value < 100000) {
    const parsed = convertExcelSerialDate(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  if (typeof value !== 'string') {
    return value;
  }

  const input = value.trim();
  if (!input) return input;

  const brMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]) - 1;
    const year = brMatch[3].length === 2 ? Number(`20${brMatch[3]}`) : Number(brMatch[3]);
    const parsed = new Date(Date.UTC(year, month, day));
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }

  const isoDate = new Date(input);
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate.toISOString().slice(0, 10);
  }

  return value;
}

function parseNumber(value: unknown): unknown {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  const normalized = trimmed
    .replace(/\s/g, '')
    .replace(/^R\$/i, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return value;
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? value : parsed;
}

function fixMojibake(text: string): string {
  return Object.entries(COMMON_MOJIBAKE_MAP).reduce(
    (acc, [wrong, right]) => acc.split(wrong).join(right),
    text
  );
}

function sanitizeString(
  value: string,
  shouldKeepLineBreaks: boolean,
  removeInvalidChars: boolean
): string {
  let output = value.normalize('NFC');
  output = fixMojibake(output);
  output = output.replace(/\u00A0/g, ' ');
  output = shouldKeepLineBreaks ? output : output.replace(/[\r\n]+/g, ' ');
  output = output.replace(/[ \t]+/g, ' ').trim();
  if (removeInvalidChars) {
    output = output.replace(CONTROL_CHARS_REGEX, '');
  }
  return output;
}

export function sanitizeRow<T extends RowData = RowData>(
  row: T,
  config: NormalizeConfig = {}
): T {
  const uppercaseFields = new Set((config.uppercaseFields ?? []).map(normalizeFieldName));
  const lowercaseFields = new Set((config.lowercaseFields ?? []).map(normalizeFieldName));
  const dateFields = new Set((config.dateFields ?? []).map(normalizeFieldName));
  const keepLineBreaksInFields = new Set(
    (config.keepLineBreaksInFields ?? []).map(normalizeFieldName)
  );
  const removeInvalidChars = config.removeInvalidChars ?? true;

  const sanitized = { ...row } as RowData;

  Object.keys(sanitized).forEach((key) => {
    const normalizedKey = normalizeFieldName(key);
    const value = sanitized[key];

    let nextValue: unknown = value;

    if (typeof nextValue === 'string') {
      nextValue = sanitizeString(
        nextValue,
        keepLineBreaksInFields.has(normalizedKey),
        removeInvalidChars
      );
      nextValue = parseNumber(nextValue);
    } else if (typeof nextValue === 'number') {
      nextValue = parseNumber(nextValue);
    }

    if (dateFields.has(normalizedKey)) {
      nextValue = parseDate(nextValue);
    }

    if (typeof nextValue === 'string') {
      const normalizedText = nextValue;
      if (uppercaseFields.has(normalizedKey)) nextValue = normalizedText.toUpperCase();
      if (lowercaseFields.has(normalizedKey)) nextValue = normalizedText.toLowerCase();
    }

    sanitized[key] = nextValue as RowData[string];
  });

  return sanitized as T;
}
