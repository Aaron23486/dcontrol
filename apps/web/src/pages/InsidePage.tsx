import { PERSON_TYPE_LABEL, PERSON_TYPES, type InsideVisit } from '@cedi/shared';
import { useState } from 'react';
import { Card } from '../components/molecules/Card';
import { PageHeader } from '../components/molecules/PageHeader';
import { SearchInput } from '../components/molecules/SearchInput';
import { SegmentedControl } from '../components/molecules/SegmentedControl';
import { CloseVisitDialog } from '../features/dashboard/CloseVisitDialog';
import { InsideList } from '../features/dashboard/InsideList';
import {
  countByType,
  filterInside,
  type InsideTypeFilter,
} from '../features/dashboard/inside-filter';
import { useInsideVisits } from '../features/dashboard/use-live-data';
import { EmptyState } from '../components/molecules/EmptyState';
import { ErrorState } from '../components/molecules/ErrorState';
import { LoadingState } from '../components/molecules/LoadingState';
import { useDocumentTitle } from '../lib/use-document-title';

const FILTERS: { value: InsideTypeFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  ...PERSON_TYPES.map((type) => ({ value: type, label: PERSON_TYPE_LABEL[type] })),
];

/** ¿Quién está dentro del CEDI ahora? Se actualiza sola cada 10 s (FR-11, D11). */
export function InsidePage() {
  useDocumentTitle('Personas dentro');
  const inside = useInsideVisits();
  const [type, setType] = useState<InsideTypeFilter>('ALL');
  const [query, setQuery] = useState('');
  const [closing, setClosing] = useState<InsideVisit | null>(null);
  const visits = inside.data ?? [];
  const counts = countByType(visits);
  const shown = filterInside(visits, type, query);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Personas dentro del CEDI"
        description="Se actualiza sola cada 10 segundos."
        icon="users"
      />
      <Card bodyClassName="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            label="Filtrar por tipo"
            value={type}
            onChange={setType}
            options={FILTERS.map((filter) => ({
              value: filter.value,
              label: `${filter.label} (${counts[filter.value] ?? 0})`,
            }))}
          />
          <SearchInput
            aria-label="Buscar por nombre o cédula"
            placeholder="Buscar por nombre o cédula"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full sm:w-80"
          />
        </div>
        {inside.error && (
          <ErrorState message={inside.error.message} onRetry={() => void inside.refetch()} />
        )}
        {inside.isPending && <LoadingState />}
        {inside.data && shown.length === 0 && (
          <EmptyState>
            {visits.length === 0
              ? 'No hay nadie dentro del CEDI.'
              : 'Nadie coincide con el filtro.'}
          </EmptyState>
        )}
        {shown.length > 0 && <InsideList visits={shown} onClose={setClosing} />}
      </Card>
      <CloseVisitDialog visit={closing} onDone={() => setClosing(null)} />
    </div>
  );
}
