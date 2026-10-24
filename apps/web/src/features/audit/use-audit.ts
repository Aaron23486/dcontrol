import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AuditFilters } from './audit-filters';
import { auditApi } from './audit.api';

export function useAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: ['audit', 'list', filters],
    queryFn: () => auditApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useAuditActors() {
  return useQuery({ queryKey: ['audit', 'actors'], queryFn: auditApi.actors });
}
