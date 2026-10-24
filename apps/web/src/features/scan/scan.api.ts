import type { EntryRegistered, RegisterEntryInput, ScanResult, VisitSummary } from '@cedi/shared';
import { apiRequest } from '../../lib/http';

export const scanApi = {
  scan: (identification: string, confirmed = false) =>
    apiRequest<ScanResult>('/scans', { method: 'POST', body: { identification, confirmed } }),
  registerEntry: (entry: RegisterEntryInput) =>
    apiRequest<EntryRegistered>('/visits', { method: 'POST', body: entry }),
  closeVisit: (visitId: string, exitAt: string) =>
    apiRequest<VisitSummary>(`/visits/${visitId}/close`, { method: 'PATCH', body: { exitAt } }),
};
