import { z } from 'zod';
import { identificationSchema, personSchema, type PersonSummary } from './persons';
import { visitDetailsSchema, type VisitSummary } from './visits';

/** D2: una operación contraria dentro de este intervalo se considera un posible doble escaneo. */
export const DOUBLE_SCAN_WINDOW_SECONDS = 60;

/** Lo que Seguridad envía al ingresar una cédula (spec §9, ADR 0006). */
export const scanSchema = z.object({
  identification: identificationSchema,
  /** El guarda ya confirmó un doble escaneo (D2) o una visita olvidada (D3). */
  confirmed: z.boolean().optional().default(false),
});
export type ScanInput = z.input<typeof scanSchema>;
export type ScanData = z.output<typeof scanSchema>;

export const ScanResultCode = {
  /** Cédula no registrada: hay que registrar a la persona y su primera entrada. */
  PERSON_NOT_FOUND: 'PERSON_NOT_FOUND',
  /** La persona no está dentro: falta confirmar la entrada (y sus datos según el tipo). */
  ENTRY_PENDING: 'ENTRY_PENDING',
  /** La persona estaba dentro: se registró su salida. */
  EXIT_REGISTERED: 'EXIT_REGISTERED',
  /** D2: la operación anterior fue hace menos de 60 s; se pide confirmación. */
  CONFIRMATION_REQUIRED: 'CONFIRMATION_REQUIRED',
  /** D3: sigue dentro desde un día anterior; se ofrece cerrar esa visita. */
  PREVIOUS_DAY_VISIT_OPEN: 'PREVIOUS_DAY_VISIT_OPEN',
} as const;
export type ScanResultCode = (typeof ScanResultCode)[keyof typeof ScanResultCode];

/** Motivo y área propuestos a partir de la visita anterior del mismo tipo (D1). */
export interface EntryPrefill {
  purpose: string;
  area: string;
}

export type ScanResult =
  | { result: typeof ScanResultCode.PERSON_NOT_FOUND; identification: string }
  | {
      result: typeof ScanResultCode.ENTRY_PENDING;
      person: PersonSummary;
      prefill: EntryPrefill | null;
    }
  | { result: typeof ScanResultCode.EXIT_REGISTERED; person: PersonSummary; visit: VisitSummary }
  | {
      result: typeof ScanResultCode.CONFIRMATION_REQUIRED;
      person: PersonSummary;
      /** Lo que se registraría si el guarda confirma. */
      pendingAction: 'ENTRY' | 'EXIT';
      lastOperationAt: string;
    }
  | {
      result: typeof ScanResultCode.PREVIOUS_DAY_VISIT_OPEN;
      person: PersonSummary;
      visit: VisitSummary;
    };

/**
 * Registrar una entrada: de una persona existente (`personId`) o de una nueva (`newPerson`),
 * que se crea junto con su primera entrada en una sola transacción.
 */
export const registerEntrySchema = z.union([
  z.strictObject({ personId: z.uuid('Persona inválida.'), details: visitDetailsSchema }),
  z
    .strictObject({ newPerson: personSchema, details: visitDetailsSchema })
    .refine((entry) => entry.newPerson.type === entry.details.personType, {
      message: 'Los datos de la visita no corresponden al tipo de persona.',
      path: ['details'],
    }),
]);
export type RegisterEntryInput = z.input<typeof registerEntrySchema>;
export type RegisterEntryData = z.output<typeof registerEntrySchema>;

export interface EntryRegistered {
  person: PersonSummary;
  visit: VisitSummary;
}

/** D3: cerrar a mano una visita olvidada indicando la hora real de salida. */
export const closeVisitSchema = z.object({
  exitAt: z.iso.datetime({ offset: true, error: 'Indica una fecha y hora de salida válida.' }),
});
export type CloseVisitInput = z.input<typeof closeVisitSchema>;
