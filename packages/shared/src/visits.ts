import { z } from 'zod';
import type { CompanySummary } from './companies';
import { PersonType } from './enums';

/** Campos de la visita que corresponden a cada tipo de persona (FR-2, R18, R19). */
export const VISIT_FIELDS_BY_TYPE = {
  [PersonType.EXTERNAL_WORKER]: [],
  [PersonType.CONTRACTOR]: ['purpose', 'area'],
  [PersonType.MAINTENANCE_TECHNICIAN]: ['purpose', 'area', 'tools'],
  [PersonType.VISITOR]: ['purpose', 'area'],
} as const satisfies Record<PersonType, readonly ('purpose' | 'area' | 'tools')[]>;

export const MAX_TOOLS_PER_VISIT = 50;

const purposeSchema = z
  .string({ error: 'El motivo es obligatorio.' })
  .trim()
  .min(1, 'El motivo es obligatorio.')
  .max(255, 'El motivo es demasiado largo.');

const areaSchema = z
  .string({ error: 'El área es obligatoria.' })
  .trim()
  .min(1, 'El área es obligatoria.')
  .max(120, 'El área es demasiado larga.');

export const visitToolSchema = z.strictObject({
  name: z
    .string({ error: 'Indica la herramienta o equipo.' })
    .trim()
    .min(1, 'Indica la herramienta o equipo.')
    .max(120, 'El nombre de la herramienta es demasiado largo.'),
  description: z.string().trim().max(255, 'La descripción es demasiado larga.').optional(),
  quantity: z
    .number({ error: 'La cantidad debe ser un número.' })
    .int('La cantidad debe ser un número entero.')
    .positive('La cantidad debe ser mayor que cero.')
    .optional(),
});
export type VisitToolInput = z.input<typeof visitToolSchema>;

/**
 * Datos de una visita según el tipo de persona. Cada variante es estricta:
 * un dato que no corresponde al tipo (p. ej. herramientas de un visitante) se rechaza.
 */
export const visitDetailsSchema = z.discriminatedUnion('personType', [
  z.strictObject({ personType: z.literal(PersonType.EXTERNAL_WORKER) }),
  z.strictObject({
    personType: z.literal(PersonType.CONTRACTOR),
    purpose: purposeSchema,
    area: areaSchema,
  }),
  z.strictObject({
    personType: z.literal(PersonType.MAINTENANCE_TECHNICIAN),
    purpose: purposeSchema,
    area: areaSchema,
    tools: z
      .array(visitToolSchema)
      .max(MAX_TOOLS_PER_VISIT, `Máximo ${MAX_TOOLS_PER_VISIT} herramientas por visita.`)
      .default([]),
  }),
  z.strictObject({
    personType: z.literal(PersonType.VISITOR),
    purpose: purposeSchema,
    area: areaSchema,
  }),
]);
export type VisitDetailsInput = z.input<typeof visitDetailsSchema>;
export type VisitDetails = z.output<typeof visitDetailsSchema>;

export interface VisitToolSummary {
  name: string;
  description: string | null;
  quantity: number | null;
}

/** Visita tal como la expone la API. Tipo y empresa son los vigentes al entrar (R17). */
export interface VisitSummary {
  id: string;
  personType: PersonType;
  company: CompanySummary;
  entryAt: string;
  exitAt: string | null;
  purpose: string | null;
  area: string | null;
  tools: VisitToolSummary[];
}

export const VisitStatusFilter = {
  INSIDE: 'INSIDE',
  EXITED: 'EXITED',
} as const;
export type VisitStatusFilter = (typeof VisitStatusFilter)[keyof typeof VisitStatusFilter];

export const VISITS_PAGE_SIZE_MAX = 100;

/**
 * Consulta del historial de visitas de un tipo (FR-10). `from` y `to` son días del CEDI
 * (AAAA-MM-DD, inclusivos) sobre la hora de entrada; sin ellos no se filtra por fecha.
 */
export const visitListQuerySchema = z
  .object({
    type: z.enum(PersonType, { error: 'Indica el tipo de persona.' }),
    from: z.iso.date('Fecha inicial inválida.').optional(),
    to: z.iso.date('Fecha final inválida.').optional(),
    status: z.enum(VisitStatusFilter).optional(),
    q: z.string().trim().max(100, 'La búsqueda es demasiado larga.').optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(VISITS_PAGE_SIZE_MAX).default(25),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: 'La fecha inicial no puede ser posterior a la final.',
    path: ['from'],
  });
export type VisitListQuery = z.output<typeof visitListQuerySchema>;

/** Fila del historial: la visita con los datos fijos de la persona. */
export interface VisitListItem extends VisitSummary {
  person: { id: string; fullName: string; identification: string };
}

/** Detalle de una visita, con quién registró la entrada y la salida. */
export interface VisitDetail extends VisitListItem {
  entryBy: { id: string; name: string };
  exitBy: { id: string; name: string } | null;
}
