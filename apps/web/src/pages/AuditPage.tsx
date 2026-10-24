import { AUDIT_ACTIONS, AUDIT_ACTION_LABEL, Role, type AuditAction } from '@cedi/shared';
import { Link, useSearchParams } from 'react-router';
import { Select } from '../components/atoms/Select';
import { DateRangeFilter } from '../components/molecules/DateRangeFilter';
import { Pagination } from '../components/molecules/Pagination';
import { AuditTable } from '../features/audit/AuditTable';
import {
  auditFiltersFromParams,
  auditParamsFromFilters,
  type AuditFilters,
} from '../features/audit/audit-filters';
import { useAuditActors, useAuditLog } from '../features/audit/use-audit';
import { RequireRole } from '../features/auth/RequireRole';
import { useNow } from '../lib/use-now';
import { EmptyState } from '../components/molecules/EmptyState';
import { ErrorState } from '../components/molecules/ErrorState';
import { LoadingState } from '../components/molecules/LoadingState';
import { useDocumentTitle } from '../lib/use-document-title';

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
    <section className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-xl font-semibold">Auditoría</h1>
      <DateRangeFilter range={filters} today={today} onChange={(range) => update(range)} />
      <div className="grid gap-3 sm:grid-cols-2 sm:max-w-xl">
        <label className="text-sm text-slate-700">
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
        <label className="text-sm text-slate-700">
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
      {filters.entityId && (
        <p className="text-sm text-slate-600">
          Mostrando solo los registros de una persona.{' '}
          <Link
            to={`?${new URLSearchParams(auditParamsFromFilters({ ...filters, entityId: undefined, page: 1 }))}`}
            className="underline"
          >
            Ver todos
          </Link>
        </p>
      )}
      {log.error && <ErrorState message={log.error.message} onRetry={() => void log.refetch()} />}
      {log.isPending && <LoadingState />}
      {log.data && log.data.items.length === 0 && (
        <EmptyState>No hay registros con estos filtros.</EmptyState>
      )}
      {log.data && log.data.items.length > 0 && (
        <>
          <p className="text-sm text-slate-500">
            {log.data.total} {log.data.total === 1 ? 'registro' : 'registros'}
          </p>
          <AuditTable items={log.data.items} />
          <Pagination
            page={log.data.page}
            pageSize={log.data.pageSize}
            total={log.data.total}
            onPageChange={(page) => setParams(auditParamsFromFilters({ ...filters, page }))}
          />
        </>
      )}
    </section>
  );
}
