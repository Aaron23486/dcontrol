import type { Page, PersonType, VisitDetail, VisitListItem } from '@cedi/shared';
import { toQueryString } from '../../lib/format';
import { apiRequest } from '../../lib/http';
import type { HistoryFilters } from './history-filters';

export const historyApi = {
  list: (type: PersonType, { from, to, status, q, page }: HistoryFilters) =>
    apiRequest<Page<VisitListItem>>(`/visits${toQueryString({ type, from, to, status, q, page })}`),
  detail: (id: string) => apiRequest<VisitDetail>(`/visits/${id}`),
};
