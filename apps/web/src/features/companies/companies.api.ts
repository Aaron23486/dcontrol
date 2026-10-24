import type { CompanySummary } from '@cedi/shared';
import { apiRequest } from '../../lib/http';
import { toQueryString } from '../../lib/format';

export const companiesApi = {
  search: (q: string) => apiRequest<CompanySummary[]>(`/companies${toQueryString({ q })}`),
  /** Crea la empresa o devuelve la existente con el mismo nombre normalizado. */
  create: (name: string) =>
    apiRequest<CompanySummary>('/companies', { method: 'POST', body: { name } }),
};
