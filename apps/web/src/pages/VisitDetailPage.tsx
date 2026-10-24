import { PERSON_TYPE_LABEL } from '@cedi/shared';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Badge } from '../components/atoms/Badge';
import { useVisitDetail } from '../features/history/use-history';
import { sectionByType, visitColumnsFor } from '../features/persons/person-sections';
import { formatDateTime, formatDuration } from '../lib/format';
import { useNow } from '../lib/use-now';
import { ErrorState } from '../components/molecules/ErrorState';
import { LoadingState } from '../components/molecules/LoadingState';
import { useDocumentTitle } from '../lib/use-document-title';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

/** Detalle de una visita: datos de ese momento (R17), herramientas y quién la registró. */
export function VisitDetailPage() {
  useDocumentTitle('Detalle de visita');
  const id = useParams().id ?? '';
  const navigate = useNavigate();
  const detail = useVisitDetail(id);
  const now = useNow();

  if (detail.isPending) return <LoadingState />;
  if (detail.error) {
    return <ErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  }
  const visit = detail.data;
  const columns = visitColumnsFor(visit.personType);
  const section = sectionByType(visit.personType);

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm text-slate-600 hover:underline"
      >
        ← Volver
      </button>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Visita de {visit.person.fullName}</h1>
        {visit.exitAt ? <Badge>Salida registrada</Badge> : <Badge tone="success">Dentro</Badge>}
      </header>

      <dl className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 text-sm sm:grid-cols-2">
        <Field label="Persona">
          <Link to={`/personas/detalle/${visit.person.id}`} className="hover:underline">
            {visit.person.fullName}
          </Link>{' '}
          <span className="font-mono text-slate-500">{visit.person.identification}</span>
        </Field>
        <Field label="Tipo y empresa en esa visita">
          {PERSON_TYPE_LABEL[visit.personType]} · {visit.company.name}
        </Field>
        <Field label="Entrada">
          {formatDateTime(visit.entryAt)} · registró {visit.entryBy.name}
        </Field>
        <Field label="Salida">
          {visit.exitAt
            ? `${formatDateTime(visit.exitAt)} · registró ${visit.exitBy?.name ?? '—'}`
            : 'Sin salida registrada'}
        </Field>
        <Field label={visit.exitAt ? 'Duración' : 'Tiempo dentro'}>
          {formatDuration(visit.entryAt, visit.exitAt ? new Date(visit.exitAt) : now)}
        </Field>
        {columns.purpose && <Field label="Motivo">{visit.purpose}</Field>}
        {columns.area && <Field label="Área">{visit.area}</Field>}
      </dl>

      {columns.tools && (
        <div className="space-y-2">
          <h2 className="font-semibold">Herramientas o equipos</h2>
          {visit.tools.length === 0 ? (
            <p className="text-sm text-slate-500">No registró herramientas en esta visita.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white text-sm">
              {visit.tools.map((tool, index) => (
                <li key={index} className="flex justify-between gap-3 px-4 py-2">
                  <span>
                    <span className="font-medium">{tool.name}</span>
                    {tool.description && (
                      <span className="text-slate-500"> · {tool.description}</span>
                    )}
                  </span>
                  {tool.quantity && <span className="text-slate-600">× {tool.quantity}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Link
        to={`/historial/${section.slug}?range=all&q=${visit.person.identification}`}
        className="inline-block text-sm text-slate-600 hover:underline"
      >
        Ver todas las visitas de {visit.person.fullName}
      </Link>
    </section>
  );
}
