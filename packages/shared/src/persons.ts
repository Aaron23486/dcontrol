import { z } from 'zod';
import type { CompanySummary } from './companies';
import { PERSON_TYPES, PersonType, Role } from './enums';
import type { VisitSummary } from './visits';

/** Nombre de cada tipo para mostrar en la interfaz (FR-2). */
export const PERSON_TYPE_LABEL: Record<PersonType, string> = {
  [PersonType.EXTERNAL_WORKER]: 'Trabajador externo',
  [PersonType.CONTRACTOR]: 'Contratista',
  [PersonType.MAINTENANCE_TECHNICIAN]: 'Mantenimiento / Técnico',
  [PersonType.VISITOR]: 'Visitante',
};

export const IDENTIFICATION_MIN_LENGTH = 4;
export const IDENTIFICATION_MAX_LENGTH = 20;

/**
 * Normaliza una cédula tal como la teclea Seguridad (D10, ADR 0008):
 * mayúsculas, sin espacios, puntos ni guiones. `1-234-567` y `1234567` son la misma persona.
 */
export function normalizeIdentification(raw: string): string {
  return raw.toUpperCase().replace(/[\s.-]/g, '');
}

/** Cédula de entrada: acepta números, letras, guiones, espacios y puntos; devuelve la forma normalizada. */
export const identificationSchema = z
  .string({ error: 'La cédula es obligatoria.' })
  .transform(normalizeIdentification)
  .pipe(
    z
      .string()
      .min(1, 'La cédula es obligatoria.')
      .regex(/^[A-Z0-9]*$/, 'La cédula solo puede tener números, letras y guiones.')
      .min(
        IDENTIFICATION_MIN_LENGTH,
        `La cédula debe tener al menos ${IDENTIFICATION_MIN_LENGTH} caracteres.`,
      )
      .max(
        IDENTIFICATION_MAX_LENGTH,
        `La cédula no puede tener más de ${IDENTIFICATION_MAX_LENGTH} caracteres.`,
      ),
  );

export const fullNameSchema = z
  .string({ error: 'El nombre es obligatorio.' })
  .trim()
  .min(3, 'Escribe el nombre completo.')
  .max(150, 'El nombre es demasiado largo.')
  .transform((name) => name.replace(/\s+/g, ' '));

/**
 * Datos de la persona, iguales para los cuatro tipos (FR-2): nombre, cédula, empresa y tipo.
 * La empresa es obligatoria para todos (D9, ADR 0009).
 */
export const personSchema = z.object({
  fullName: fullNameSchema,
  identification: identificationSchema,
  type: z.enum(PERSON_TYPES, { error: 'Selecciona el tipo de persona.' }),
  companyId: z.uuid({ error: 'Selecciona la empresa.' }),
});
export type PersonInput = z.input<typeof personSchema>;
export type PersonData = z.output<typeof personSchema>;

/** Cambios a una persona. Solo se envían los campos modificados. */
export const updatePersonSchema = personSchema
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, 'No hay cambios para guardar.');
export type UpdatePersonInput = z.input<typeof updatePersonSchema>;
export type UpdatePersonData = z.output<typeof updatePersonSchema>;

/** Datos fijos de la persona: solo un Administrador los corrige (D13, ADR 0008). */
export const PERSON_IDENTITY_FIELDS = ['fullName', 'identification'] as const;

export const canCorrectPersonIdentity = (role: Role): boolean => role === Role.ADMIN;

export const PERSONS_PAGE_SIZE_MAX = 100;

/** Consulta de una sección de personas (una por tipo, FR-9). */
export const personListQuerySchema = z.object({
  type: z.enum(PERSON_TYPES, { error: 'Indica el tipo de persona.' }),
  q: z.string().trim().max(100, 'La búsqueda es demasiado larga.').optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(PERSONS_PAGE_SIZE_MAX).default(20),
});
export type PersonListQuery = z.output<typeof personListQuerySchema>;

/** Resumen de la última visita, para las columnas de cada sección. */
export interface LastVisitSummary {
  entryAt: string;
  exitAt: string | null;
  purpose: string | null;
  area: string | null;
  toolsCount: number;
}

export interface PersonSummary {
  id: string;
  fullName: string;
  identification: string;
  type: PersonType;
  company: CompanySummary;
  /** Tiene una visita abierta (D5). */
  isInside: boolean;
  lastVisit: LastVisitSummary | null;
}

export interface PersonDetail extends PersonSummary {
  createdAt: string;
  /** Visitas más recientes primero. */
  visits: VisitSummary[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
