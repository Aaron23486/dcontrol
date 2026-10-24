import { AUDIT_ACTIONS, type AuditAction } from '@cedi/shared';
import { rangeFromParams, rangeToParams, type DateRange } from '../../lib/date-range';

/** Filtros de la auditoría en la URL. Por defecto, los últimos 7 días. */
export interface AuditFilters extends DateRange {
  action?: AuditAction;
  userId?: string;
  entityId?: string;
  page: number;
}

export function auditFiltersFromParams(params: URLSearchParams, today: Date): AuditFilters {
  const action = params.get('action');
  return {
    ...rangeFromParams(params, today, 'last7'),
    action: (AUDIT_ACTIONS as string[]).includes(action ?? '')
      ? (action as AuditAction)
      : undefined,
    userId: params.get('userId') ?? undefined,
    entityId: params.get('entityId') ?? undefined,
    page: Math.max(1, Number(params.get('page') ?? '1') || 1),
  };
}

export function auditParamsFromFilters(filters: AuditFilters): Record<string, string> {
  return {
    ...rangeToParams(filters),
    ...(filters.action && { action: filters.action }),
    ...(filters.userId && { userId: filters.userId }),
    ...(filters.entityId && { entityId: filters.entityId }),
    ...(filters.page > 1 && { page: String(filters.page) }),
  };
}
