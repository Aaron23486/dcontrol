import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LIVE_REFRESH_MS } from '@cedi/shared';
import { dashboardApi } from './dashboard.api';

/** Datos que cambian con cada entrada o salida, en esta u otra caseta (D11). */
const LIVE_KEY = ['live'] as const;

export function useDashboardSummary() {
  return useQuery({
    queryKey: [...LIVE_KEY, 'summary'],
    queryFn: dashboardApi.summary,
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function useInsideVisits() {
  return useQuery({
    queryKey: [...LIVE_KEY, 'inside'],
    queryFn: dashboardApi.inside,
    refetchInterval: LIVE_REFRESH_MS,
  });
}

/** Tras una operación local se refresca al instante, sin esperar al siguiente sondeo. */
export function useRefreshLiveData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: LIVE_KEY }),
      queryClient.invalidateQueries({ queryKey: ['persons'] }),
      queryClient.invalidateQueries({ queryKey: ['visits'] }),
    ]);
}
