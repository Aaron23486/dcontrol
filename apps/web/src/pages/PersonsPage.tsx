import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router';
import { Input } from '../components/atoms/Input';
import { Pagination } from '../components/molecules/Pagination';
import { PersonTypeTabs } from '../features/persons/PersonTypeTabs';
import { PersonsTable } from '../features/persons/PersonsTable';
import { DEFAULT_SECTION, sectionBySlug } from '../features/persons/person-sections';
import { usePersonList } from '../features/persons/use-persons';
import { useDebouncedValue } from '../lib/use-debounced-value';
import { EmptyState } from '../components/molecules/EmptyState';
import { ErrorState } from '../components/molecules/ErrorState';
import { LoadingState } from '../components/molecules/LoadingState';
import { useDocumentTitle } from '../lib/use-document-title';

/** Personas separadas por tipo; búsqueda y página viven en la URL para poder volver atrás. */
export function PersonsPage() {
  useDocumentTitle('Personas');
  const { section: slug } = useParams();
  const section = sectionBySlug(slug);
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? '1') || 1;
  const [text, setText] = useState(q);
  const debounced = useDebouncedValue(text, 300);

  useEffect(() => {
    if (debounced.trim() !== q) {
      setParams(debounced.trim() ? { q: debounced.trim() } : {}, { replace: true });
    }
  }, [debounced, q, setParams]);

  const list = usePersonList({ type: section?.type ?? DEFAULT_SECTION.type, q, page });

  if (!section) return <Navigate to={`/personas/${DEFAULT_SECTION.slug}`} replace />;

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Personas</h1>
        <Link
          to={`/personas/${section.slug}/nueva`}
          className="inline-flex min-h-10 items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Registrar persona
        </Link>
      </div>
      <PersonTypeTabs basePath="/personas" />
      <Input
        type="search"
        aria-label={`Buscar en ${section.title}`}
        placeholder="Buscar por nombre, cédula o empresa"
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="max-w-md"
      />
      {list.error && (
        <ErrorState message={list.error.message} onRetry={() => void list.refetch()} />
      )}
      {list.isPending && <LoadingState />}
      {list.data && list.data.items.length === 0 && (
        <EmptyState>
          {q
            ? `No hay resultados para «${q}» en ${section.title}.`
            : `Aún no hay ${section.title.toLowerCase()} registrados.`}
        </EmptyState>
      )}
      {list.data && list.data.items.length > 0 && (
        <>
          <p className="text-sm text-slate-500">
            {list.data.total} {list.data.total === 1 ? 'persona' : 'personas'}
          </p>
          <PersonsTable type={section.type} persons={list.data.items} />
          <Pagination
            page={list.data.page}
            pageSize={list.data.pageSize}
            total={list.data.total}
            onPageChange={(next) => setParams({ ...(q ? { q } : {}), page: String(next) })}
          />
        </>
      )}
    </section>
  );
}
