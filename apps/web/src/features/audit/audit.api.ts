import type { AuditActor, AuditLogItem, Page } from '@cedi/shared';
import { toQueryString } from '../../lib/format';
import { apiRequest } from '../../lib/http';
import type { AuditFilters } from './audit-filters';

export const auditApi = {
  list: ({ from, to, action, userId, entityId, page }: AuditFilters) =>
    apiRequest<Page<AuditLogItem>>(
      `/audit${toQueryString({ from, to, action, userId, entityId, page })}`,
    ),
  actors: () => apiRequest<AuditActor[]>('/audit/actors'),
};
