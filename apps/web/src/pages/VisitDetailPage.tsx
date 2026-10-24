import { PERSON_TYPE_LABEL } from '@cedi/shared';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Badge } from '../components/atoms/Badge';
import { Icon } from '../components/atoms/Icon';
import { BackLink } from '../components/molecules/BackLink';
import { Card } from '../components/molecules/Card';
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
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className="mt-1 text-ink">{children}</dd>
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
    <div className="mx-auto max-w-4xl space-y-4">
      <BackLink onClick={() => navigate(-1)}>Volver</BackLink>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Visita de {visit.person.fullName}
        </h1>
        {visit.exitAt ? <Badge>Salida registrada</Badge> : <Badge tone="success">Dentro</Badge>}
      </div>

      <Card bodyClassName="p-5">
        <dl className="grid gap-5 text-sm sm:grid-cols-2">
          <Field label="Persona">
            <Link
              to={`/personas/detalle/${visit.person.id}`}
              className="font-semibold text-primary-strong hover:underline"
            >
              {visit.person.fullName}
            </Link>{' '}
            <span className="text-ink-muted">{visit.person.identification}</span>
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
      </Card>

      {columns.tools && (
        <Card title="Herramientas o equipos" bodyClassName="px-4 pb-4">
          {visit.tools.length === 0 ? (
            <p className="text-sm text-ink-muted">No registró herramientas en esta visita.</p>
          ) : (
            <ul className="divide-y divide-line-soft rounded-lg border border-line text-sm">
              {visit.tools.map((tool, index) => (
                <li key={index} className="flex justify-between gap-3 px-4 py-2.5">
                  <span>
                    <span className="font-semibold text-ink">{tool.name}</span>
                    {tool.description && (
                      <span className="text-ink-muted"> · {tool.description}</span>
                    )}
                  </span>
                  {tool.quantity && (
                    <span className="tabular-nums text-ink-soft">× {tool.quantity}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Link
        to={`/historial/${section.slug}?range=all&q=${visit.person.identification}`}
        className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary-strong hover:underline"
      >
        Ver todas las visitas de {visit.person.fullName}
        <Icon name="arrowRight" className="h-4 w-4" />
      </Link>
    </div>
  );
}
