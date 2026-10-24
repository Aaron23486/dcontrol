import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PersonType } from '@cedi/shared';
import type { HistoryFilters } from './history-filters';
import { historyApi } from './history.api';

export function useVisitHistory(type: PersonType, filters: HistoryFilters) {
  return useQuery({
    queryKey: ['visits', 'history', type, filters],
    queryFn: () => historyApi.list(type, filters),
    placeholderData: keepPreviousData,
  });
}

export function useVisitDetail(id: string) {
  return useQuery({
    queryKey: ['visits', 'detail', id],
    queryFn: () => historyApi.detail(id),
    retry: false,
  });
}
