import { VisitStatusFilter } from '@cedi/shared';
import { useEffect, useState } from 'react';
import { Input } from '../../components/atoms/Input';
import { Select } from '../../components/atoms/Select';
import { DateRangeFilter } from '../../components/molecules/DateRangeFilter';
import { useDebouncedValue } from '../../lib/use-debounced-value';
import type { HistoryFilters } from './history-filters';

interface HistoryFiltersBarProps {
  filters: HistoryFilters;
  today: Date;
  /** Recibe los filtros nuevos; cualquier cambio vuelve a la página 1. */
  onChange: (filters: HistoryFilters) => void;
}

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
    <div className="space-y-3">
      <DateRangeFilter
        range={filters}
        today={today}
        onChange={({ from, to }) => update({ from, to })}
      />
      <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
        <label className="text-sm text-slate-700">
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
        <label className="text-sm text-slate-700">
          Buscar
          <Input
            type="search"
            placeholder="Nombre, cédula o empresa"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
