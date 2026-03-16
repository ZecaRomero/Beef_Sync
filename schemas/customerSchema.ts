import { z } from 'zod';

const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const phoneRegex = /^\+?\d{10,13}$/;

const toNumber = (value: unknown): unknown => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return value;

  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? value : parsed;
};

export const CustomerSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(120),
  email: z.string().trim().email('Email inválido').max(180),
  age: z.preprocess(toNumber, z.number().min(0).max(120)),
  cpf: z
    .string()
    .trim()
    .regex(cpfRegex, 'CPF inválido (use formato 000.000.000-00)'),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[^\d+]/g, ''))
    .refine((value) => phoneRegex.test(value), 'Telefone inválido'),
  birthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
});

export type CustomerImportRow = z.infer<typeof CustomerSchema>;
