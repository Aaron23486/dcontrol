import { VisitStatusFilter } from '@cedi/shared';
import { rangeFromParams, rangeToParams, type DateRange } from '../../lib/date-range';

/** Filtros del historial tal como viven en la URL (`?from=…&to=…&status=…&q=…&page=…`). */
export interface HistoryFilters extends DateRange {
  status?: VisitStatusFilter;
  q?: string;
  page: number;
}

/** Lee los filtros de la URL. Sin fechas ni `range=all`, se muestran las visitas de hoy. */
export function filtersFromParams(params: URLSearchParams, today: Date): HistoryFilters {
  const status = params.get('status');
  return {
    ...rangeFromParams(params, today, 'today'),
    status:
      status === VisitStatusFilter.INSIDE || status === VisitStatusFilter.EXITED
        ? status
        : undefined,
    q: params.get('q') ?? undefined,
    page: Math.max(1, Number(params.get('page') ?? '1') || 1),
  };
}

/** Escribe los filtros en la URL. */
export function paramsFromFilters(filters: HistoryFilters): Record<string, string> {
  return {
    ...rangeToParams(filters),
    ...(filters.status && { status: filters.status }),
    ...(filters.q && { q: filters.q }),
    ...(filters.page > 1 && { page: String(filters.page) }),
  };
}
