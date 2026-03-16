import { z } from 'zod';

const numberFromUnknown = (value: unknown): unknown => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return value;

  const normalized = value
    .trim()
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? value : parsed;
};

const optionalText = z
  .string()
  .trim()
  .max(255)
  .optional()
  .transform((value) => (value && value.length ? value : undefined));

export const ColetaFivImportSchema = z.object({
  doadora_identificador: z.string().trim().min(1, 'Rgd/RQd da doadora é obrigatório'),
  doadora_nome: optionalText,
  laboratorio: z.string().trim().min(2, 'Laboratório é obrigatório').max(100),
  veterinario: z.string().trim().min(2, 'Veterinário é obrigatório').max(100),
  data_fiv: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data FIV deve estar no formato YYYY-MM-DD'),
  touro: optionalText,
  observacoes: optionalText,
  quantidade_oocitos: z.preprocess(numberFromUnknown, z.number().int().min(0).max(9999)).default(0),
  embrioes_produzidos: z.preprocess(numberFromUnknown, z.number().int().min(0).max(9999)).default(0),
  embrioes_transferidos: z.preprocess(numberFromUnknown, z.number().int().min(0).max(9999)).default(0),
  quantidade_te: z.preprocess(numberFromUnknown, z.number().int().min(0).max(9999)).default(0),
});

export type ColetaFivImportRow = z.infer<typeof ColetaFivImportSchema>;
