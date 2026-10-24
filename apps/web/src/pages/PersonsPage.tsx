import { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router';
import { ButtonLink } from '../components/atoms/Button';
import { Icon } from '../components/atoms/Icon';
import { Card } from '../components/molecules/Card';
import { PageHeader } from '../components/molecules/PageHeader';
import { Pagination } from '../components/molecules/Pagination';
import { SearchInput } from '../components/molecules/SearchInput';
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
    <div className="space-y-4">
      <PageHeader
        title="Personas"
        description="Personal externo registrado, separado por tipo."
        icon="users"
        actions={
          <ButtonLink to={`/personas/${section.slug}/nueva`}>
            <Icon name="plus" className="h-4 w-4" />
            Registrar persona
          </ButtonLink>
        }
      />
      <Card>
        <PersonTypeTabs basePath="/personas" className="px-4" />
        <div className="border-b border-line p-4">
          <SearchInput
            aria-label={`Buscar en ${section.title}`}
            placeholder="Buscar por nombre, cédula o empresa"
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="w-full sm:max-w-md"
          />
        </div>
        <div className="space-y-3 p-4">
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
              <p className="text-sm text-ink-muted">
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
        </div>
      </Card>
    </div>
  );
}
