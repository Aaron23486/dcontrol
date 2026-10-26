import type { Page } from '@cedi/shared';
import type { ReactNode } from 'react';
import { formatCount } from '../../lib/format';
import { EmptyState } from '../molecules/EmptyState';
import { ErrorState } from '../molecules/ErrorState';
import { LoadingState } from '../molecules/LoadingState';
import { Pagination } from '../molecules/Pagination';

/** Lo que usa este componente de una consulta paginada de TanStack Query. */
interface PageQuery<T> {
  data?: Page<T>;
  error: Error | null;
  isPending: boolean;
  refetch: () => unknown;
}

interface PaginatedResultsProps<T> {
  query: PageQuery<T>;
  /** Sustantivo del contador, p. ej. `{ one: 'persona', other: 'personas' }`. */
  noun: { one: string; other: string };
  /** Mensaje cuando la consulta no devuelve resultados. */
  empty: ReactNode;
  onPageChange: (page: number) => void;
  /** La tabla de la página con los resultados actuales. */
  children: (items: T[]) => ReactNode;
}

/**
 * Resultados de una lista paginada: error con reintento, carga, vacío, contador, tabla y
 * paginación. Lo comparten Personas, Historial y Auditoría.
 */
export function PaginatedResults<T>({
  query,
  noun,
  empty,
  onPageChange,
  children,
}: PaginatedResultsProps<T>) {
  const { data } = query;
  return (
    <>
      {query.error && (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      )}
      {query.isPending && <LoadingState />}
      {data && data.items.length === 0 && <EmptyState>{empty}</EmptyState>}
      {data && data.items.length > 0 && (
        <>
          <p className="text-sm text-ink-muted">{formatCount(data.total, noun)}</p>
          {children(data.items)}
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={onPageChange}
          />
        </>
      )}
    </>
  );
}
