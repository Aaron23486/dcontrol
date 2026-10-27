import { Navigate, useLocation, useParams, useSearchParams } from 'react-router';
import { Card } from '../components/molecules/Card';
import { PageHeader } from '../components/molecules/PageHeader';
import { PaginatedResults } from '../components/organisms/PaginatedResults';
import { HistoryFiltersBar } from '../features/history/HistoryFiltersBar';
import { VisitHistoryTable } from '../features/history/VisitHistoryTable';
import { filtersFromParams, paramsFromFilters } from '../features/history/history-filters';
import { useVisitHistory } from '../features/history/use-history';
import { PersonTypeTabs } from '../features/persons/PersonTypeTabs';
import { DEFAULT_SECTION, sectionBySlug } from '../features/persons/person-sections';
import { useNow } from '../lib/use-now';
import { useDocumentTitle } from '../lib/use-document-title';

/** Historial de visitas separado por tipo, con filtros en la URL (FR-10, ADR 0009). */
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
    <div className="space-y-4">
      <PageHeader
        title="Historial de visitas"
        description="Entradas y salidas registradas, separadas por tipo de persona."
        icon="history"
      />
      <Card>
        {/* Al cambiar de pestaña se conservan las fechas y el estado, no la página. */}
        <PersonTypeTabs
          basePath="/historial"
          search={`?${new URLSearchParams(paramsFromFilters({ ...filters, page: 1 })).toString()}`}
          className="px-4"
        />
        <div className="border-b border-line p-4">
          <HistoryFiltersBar
            filters={filters}
            today={today}
            onChange={(next) => setParams(paramsFromFilters(next), { replace: true })}
          />
        </div>
        <div className="space-y-3 p-4">
          <PaginatedResults
            query={history}
            noun={{ one: 'visita', other: 'visitas' }}
            empty={`No hay visitas de ${section.title.toLowerCase()} con estos filtros.`}
            onPageChange={(page) => setParams(paramsFromFilters({ ...filters, page }))}
          >
            {(visits) => <VisitHistoryTable type={section.type} visits={visits} />}
          </PaginatedResults>
        </div>
      </Card>
    </div>
  );
}
