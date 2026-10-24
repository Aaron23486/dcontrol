import { z } from 'zod';

/** Acciones auditadas (spec §19). */
export const AuditAction = {
  PERSON_CREATED: 'PERSON_CREATED',
  PERSON_UPDATED: 'PERSON_UPDATED',
  VISIT_ENTRY_REGISTERED: 'VISIT_ENTRY_REGISTERED',
  VISIT_EXIT_REGISTERED: 'VISIT_EXIT_REGISTERED',
  /** D3: visita olvidada cerrada a mano con la hora de salida indicada. */
  VISIT_CLOSED_MANUALLY: 'VISIT_CLOSED_MANUALLY',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
export const AUDIT_ACTIONS = Object.values(AuditAction);

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  [AuditAction.PERSON_CREATED]: 'Registró persona',
  [AuditAction.PERSON_UPDATED]: 'Modificó datos de persona',
  [AuditAction.VISIT_ENTRY_REGISTERED]: 'Registró entrada',
  [AuditAction.VISIT_EXIT_REGISTERED]: 'Registró salida',
  [AuditAction.VISIT_CLOSED_MANUALLY]: 'Cerró visita sin salida',
};

export const AuditEntity = {
  PERSON: 'PERSON',
  VISIT: 'VISIT',
} as const;
export type AuditEntity = (typeof AuditEntity)[keyof typeof AuditEntity];

/** Nombre legible de cada campo que puede aparecer en `changedFields` (D12: nunca valores). */
export const AUDIT_FIELD_LABEL: Record<string, string> = {
  fullName: 'Nombre',
  identification: 'Cédula',
  type: 'Tipo',
  companyId: 'Empresa',
  exitAt: 'Hora de salida',
};

export const AUDIT_PAGE_SIZE_MAX = 100;

/** Consulta de la auditoría (solo Admin, D12). Fechas como días del CEDI (D6), inclusivas. */
export const auditListQuerySchema = z
  .object({
    from: z.iso.date('Fecha inicial inválida.').optional(),
    to: z.iso.date('Fecha final inválida.').optional(),
    action: z.enum(AuditAction, { error: 'Acción desconocida.' }).optional(),
    userId: z.uuid('Usuario inválido.').optional(),
    /** Registros sobre un elemento concreto (p. ej. una persona). */
    entityId: z.uuid('Registro inválido.').optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(AUDIT_PAGE_SIZE_MAX).default(50),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: 'La fecha inicial no puede ser posterior a la final.',
    path: ['from'],
  });
export type AuditListQuery = z.output<typeof auditListQuerySchema>;

/** Sobre qué registro se hizo la acción, en palabras, con lo necesario para enlazarlo. */
export interface AuditTarget {
  entity: AuditEntity;
  id: string;
  /** Persona afectada (en visitas, la persona de la visita). `null` si ya no existe. */
  person: { id: string; fullName: string; identification: string } | null;
  /** Solo en visitas: hora de entrada, para distinguir una visita de otra. */
  visitEntryAt?: string;
}

export interface AuditLogItem {
  id: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  action: AuditAction;
  changedFields: string[];
  target: AuditTarget;
}

/** Usuarios que aparecen en la auditoría, para el filtro. */
export interface AuditActor {
  id: string;
  name: string;
  email: string;
}
