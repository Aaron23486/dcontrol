import { z } from 'zod';
import { normalizeSearchText } from './text';

/**
 * Normaliza el nombre de una empresa para detectar duplicados (D9).
 * Ej.: " Acme  S.A. de C.V." y "ACME SA DE CV" producen el mismo valor.
 */
export const normalizeCompanyName = normalizeSearchText;

export const companyNameSchema = z
  .string({ error: 'El nombre de la empresa es obligatorio.' })
  .trim()
  .max(150, 'El nombre de la empresa es demasiado largo.')
  .refine(
    (name) => normalizeCompanyName(name).length >= 2,
    'El nombre de la empresa es demasiado corto.',
  );

export const createCompanySchema = z.object({ name: companyNameSchema });
export type CreateCompanyInput = z.input<typeof createCompanySchema>;

export const companySearchSchema = z.object({
  q: z.string().trim().max(100).optional(),
});

export interface CompanySummary {
  id: string;
  name: string;
}
