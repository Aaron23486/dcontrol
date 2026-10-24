import { Navigate, useLocation, useParams, useSearchParams } from 'react-router';
import { Pagination } from '../components/molecules/Pagination';
import { HistoryFiltersBar } from '../features/history/HistoryFiltersBar';
import { VisitHistoryTable } from '../features/history/VisitHistoryTable';
import { filtersFromParams, paramsFromFilters } from '../features/history/history-filters';
import { useVisitHistory } from '../features/history/use-history';
import { PersonTypeTabs } from '../features/persons/PersonTypeTabs';
import { DEFAULT_SECTION, sectionBySlug } from '../features/persons/person-sections';
import { useNow } from '../lib/use-now';
import { EmptyState } from '../components/molecules/EmptyState';
import { ErrorState } from '../components/molecules/ErrorState';
import { LoadingState } from '../components/molecules/LoadingState';
import { useDocumentTitle } from '../lib/use-document-title';

/** Historial de visitas separado por tipo, con filtros en la URL (spec §16, ADR 0009). */
export function HistoryPage() {
  useDocumentTitle('Historial');
  const section = sectionBySlug(useParams().section);
  const { search } = useLocation();
  const [params, setParams] = useSearchParams();
  const today = useNow(60_000);
  const filters = filtersFromParams(params, today);
  const history = useVisitHistory(section?.type ?? DEFAULT_SECTION.type, filters);

  if (!section) return <Navigate to={`/historial/${DEFAULT_SECTION.slug}${search}`} replace />;

  return (
    <section className="mx-auto max-w-7xl space-y-4">
      <h1 className="text-xl font-semibold">Historial de visitas</h1>
      {/* Al cambiar de pestaña se conservan las fechas y el estado, no la página. */}
      <PersonTypeTabs
        basePath="/historial"
        search={`?${new URLSearchParams(paramsFromFilters({ ...filters, page: 1 })).toString()}`}
      />
      <HistoryFiltersBar
        filters={filters}
        today={today}
        onChange={(next) => setParams(paramsFromFilters(next), { replace: true })}
      />
      {history.error && (
        <ErrorState message={history.error.message} onRetry={() => void history.refetch()} />
      )}
      {history.isPending && <LoadingState />}
      {history.data && history.data.items.length === 0 && (
        <EmptyState>No hay visitas de {section.title.toLowerCase()} con estos filtros.</EmptyState>
      )}
      {history.data && history.data.items.length > 0 && (
        <>
          <p className="text-sm text-slate-500">
            {history.data.total} {history.data.total === 1 ? 'visita' : 'visitas'}
          </p>
          <VisitHistoryTable type={section.type} visits={history.data.items} />
          <Pagination
            page={history.data.page}
            pageSize={history.data.pageSize}
            total={history.data.total}
            onPageChange={(page) => setParams(paramsFromFilters({ ...filters, page }))}
          />
        </>
      )}
    </section>
  );
}
