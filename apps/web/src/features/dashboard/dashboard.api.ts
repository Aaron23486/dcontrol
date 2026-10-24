import type { DashboardSummary, InsideVisit } from '@cedi/shared';
import { apiRequest } from '../../lib/http';

export const dashboardApi = {
  summary: () => apiRequest<DashboardSummary>('/dashboard/summary'),
  inside: () => apiRequest<InsideVisit[]>('/visits/inside'),
};
