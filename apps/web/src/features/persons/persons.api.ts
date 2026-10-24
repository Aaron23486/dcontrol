import type {
  Page,
  PersonDetail,
  PersonInput,
  PersonSummary,
  PersonType,
  UpdatePersonInput,
} from '@cedi/shared';
import { toQueryString } from '../../lib/format';
import { apiRequest } from '../../lib/http';

export interface PersonListParams {
  type: PersonType;
  q?: string;
  page: number;
}

export const personsApi = {
  list: ({ type, q, page }: PersonListParams) =>
    apiRequest<Page<PersonSummary>>(`/persons${toQueryString({ type, q, page })}`),
  detail: (id: string) => apiRequest<PersonDetail>(`/persons/${id}`),
  create: (input: PersonInput) =>
    apiRequest<PersonSummary>('/persons', { method: 'POST', body: input }),
  update: (id: string, changes: UpdatePersonInput) =>
    apiRequest<PersonSummary>(`/persons/${id}`, { method: 'PATCH', body: changes }),
};
