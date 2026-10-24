import { VisitStatusFilter } from '@cedi/shared';
import { useEffect, useState } from 'react';
import { Select } from '../../components/atoms/Select';
import { DateRangeFilter } from '../../components/molecules/DateRangeFilter';
import { SearchInput } from '../../components/molecules/SearchInput';
import { useDebouncedValue } from '../../lib/use-debounced-value';
import type { HistoryFilters } from './history-filters';

interface HistoryFiltersBarProps {
  filters: HistoryFilters;
  today: Date;
  /** Recibe los filtros nuevos; cualquier cambio vuelve a la página 1. */
  onChange: (filters: HistoryFilters) => void;
}

const LABEL = 'flex flex-col gap-1.5 text-sm font-medium text-ink-soft';

/** Filtros del historial: fechas, estado y búsqueda (spec §16). */
export function HistoryFiltersBar({ filters, today, onChange }: HistoryFiltersBarProps) {
  const [text, setText] = useState(filters.q ?? '');
  const debounced = useDebouncedValue(text.trim(), 300);
  const update = (changes: Partial<HistoryFilters>) =>
    onChange({ ...filters, ...changes, page: 1 });

  // Aplica la búsqueda cuando el texto deja de cambiar; la condición evita repetirla.
  useEffect(() => {
    if (debounced !== (filters.q ?? '')) {
      onChange({ ...filters, q: debounced || undefined, page: 1 });
    }
  }, [debounced, filters, onChange]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <DateRangeFilter
        range={filters}
        today={today}
        onChange={({ from, to }) => update({ from, to })}
      />
      <label className={`${LABEL} w-44`}>
        Estado
        <Select
          value={filters.status ?? ''}
          onChange={(event) =>
            update({ status: (event.target.value || undefined) as VisitStatusFilter | undefined })
          }
        >
          <option value="">Todas</option>
          <option value={VisitStatusFilter.INSIDE}>Dentro</option>
          <option value={VisitStatusFilter.EXITED}>Salida registrada</option>
        </Select>
      </label>
      <label className={`${LABEL} min-w-56 flex-1`}>
        Buscar
        <SearchInput
          placeholder="Nombre, cédula o empresa"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
    </div>
  );
}
