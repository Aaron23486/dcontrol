import { PERSON_TYPE_LABEL, PERSON_TYPES, type InsideVisit } from '@cedi/shared';
import { useState } from 'react';
import { Input } from '../components/atoms/Input';
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

/** ¿Quién está dentro del CEDI ahora? Se actualiza sola cada 10 s (spec §17, D11). */
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
    <section className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-xl font-semibold">Personas dentro del CEDI</h1>
      <div role="group" aria-label="Filtrar por tipo" className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            aria-pressed={type === filter.value}
            onClick={() => setType(filter.value)}
            className={`min-h-10 rounded-full border px-4 py-1 text-sm ${
              type === filter.value
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {filter.label} ({counts[filter.value] ?? 0})
          </button>
        ))}
      </div>
      <Input
        type="search"
        aria-label="Buscar por nombre o cédula"
        placeholder="Buscar por nombre o cédula"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="max-w-md"
      />
      {inside.error && (
        <ErrorState message={inside.error.message} onRetry={() => void inside.refetch()} />
      )}
      {inside.isPending && <LoadingState />}
      {inside.data && shown.length === 0 && (
        <EmptyState>
          {visits.length === 0 ? 'No hay nadie dentro del CEDI.' : 'Nadie coincide con el filtro.'}
        </EmptyState>
      )}
      {shown.length > 0 && <InsideList visits={shown} onClose={setClosing} />}
      <CloseVisitDialog visit={closing} onDone={() => setClosing(null)} />
    </section>
  );
}
