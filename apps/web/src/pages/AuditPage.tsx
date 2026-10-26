import { AUDIT_ACTIONS, AUDIT_ACTION_LABEL, Role, type AuditAction } from '@cedi/shared';
import { Link, useSearchParams } from 'react-router';
import { Select } from '../components/atoms/Select';
import { Card } from '../components/molecules/Card';
import { PageHeader } from '../components/molecules/PageHeader';
import { DateRangeFilter } from '../components/molecules/DateRangeFilter';
import { PaginatedResults } from '../components/organisms/PaginatedResults';
import { AuditTable } from '../features/audit/AuditTable';
import {
  auditFiltersFromParams,
  auditParamsFromFilters,
  type AuditFilters,
} from '../features/audit/audit-filters';
import { useAuditActors, useAuditLog } from '../features/audit/use-audit';
import { RequireRole } from '../features/auth/RequireRole';
import { useNow } from '../lib/use-now';
import { useDocumentTitle } from '../lib/use-document-title';

const LABEL = 'flex flex-col gap-1.5 text-sm font-medium text-ink-soft';

/** Auditoría: solo el Administrador la consulta (D12). */
export function AuditPage() {
  useDocumentTitle('Auditoría');
  return (
    <RequireRole roles={[Role.ADMIN]}>
      <AuditView />
    </RequireRole>
  );
}

function AuditView() {
  const [params, setParams] = useSearchParams();
  const today = useNow(60_000);
  const filters = auditFiltersFromParams(params, today);
  const log = useAuditLog(filters);
  const actors = useAuditActors();
  const update = (changes: Partial<AuditFilters>) =>
    setParams(auditParamsFromFilters({ ...filters, ...changes, page: 1 }), { replace: true });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Auditoría"
        description="Quién registró o modificó qué y cuándo. Solo para administradores."
        icon="shield"
      />
      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-line p-4">
          <DateRangeFilter range={filters} today={today} onChange={(range) => update(range)} />
          <label className={`${LABEL} w-full sm:w-56`}>
            Acción
            <Select
              value={filters.action ?? ''}
              onChange={(event) =>
                update({ action: (event.target.value || undefined) as AuditAction | undefined })
              }
            >
              <option value="">Todas</option>
              {AUDIT_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {AUDIT_ACTION_LABEL[action]}
                </option>
              ))}
            </Select>
          </label>
          <label className={`${LABEL} w-full sm:w-64`}>
            Usuario
            <Select
              value={filters.userId ?? ''}
              onChange={(event) => update({ userId: event.target.value || undefined })}
            >
              <option value="">Todos</option>
              {actors.data?.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.name} ({actor.email})
                </option>
              ))}
            </Select>
          </label>
        </div>
        <div className="space-y-3 p-4">
          {filters.entityId && (
            <p className="flex flex-wrap items-center gap-x-2 rounded-lg border border-primary/20 bg-primary-soft px-3 py-2 text-sm text-primary-strong">
              Mostrando solo los registros de una persona.
              <Link
                to={`?${new URLSearchParams(auditParamsFromFilters({ ...filters, entityId: undefined, page: 1 }))}`}
                className="font-semibold underline"
              >
                Ver todos
              </Link>
            </p>
          )}
          <PaginatedResults
            query={log}
            noun={{ one: 'registro', other: 'registros' }}
            empty="No hay registros con estos filtros."
            onPageChange={(page) => setParams(auditParamsFromFilters({ ...filters, page }))}
          >
            {(items) => <AuditTable items={items} />}
          </PaginatedResults>
        </div>
      </Card>
    </div>
  );
}
