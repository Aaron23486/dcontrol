import type { CompanySummary } from './companies';
import type { PersonType } from './enums';

/** Actualización de las vistas en vivo: cada 10 s más invalidación tras cada operación (D11). */
export const LIVE_REFRESH_MS = 10_000;

/** Visita abierta, tal como la muestra «Personas dentro» (spec §17). */
export interface InsideVisit {
  visitId: string;
  person: { id: string; fullName: string; identification: string };
  /** Tipo y empresa vigentes al entrar (R17). */
  personType: PersonType;
  company: CompanySummary;
  entryAt: string;
  purpose: string | null;
  area: string | null;
  /** D3: sigue abierta desde un día anterior (probablemente olvidó registrar la salida). */
  isFromPreviousDay: boolean;
}

export interface ActivityItem {
  visitId: string;
  kind: 'ENTRY' | 'EXIT';
  at: string;
  personName: string;
  personType: PersonType;
  company: CompanySummary;
}

/** Resumen del día del CEDI (spec §14). «Hoy» se cuenta en la zona horaria del CEDI (D6). */
export interface DashboardSummary {
  insideCount: number;
  entriesToday: number;
  exitsToday: number;
  /** Visitas abiertas desde un día anterior (D3). */
  forgottenCount: number;
  recentActivity: ActivityItem[];
}
