import { PERSON_TYPE_LABEL, type VisitSummary } from '@cedi/shared';
import type { ReactNode } from 'react';
import { Badge } from '../../components/atoms/Badge';
import { formatDateTime, formatToolLabel } from '../../lib/format';
import { visitColumnsFor } from './person-sections';

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="inline font-medium text-ink-soft">{label}: </dt>
      <dd className="inline">{children}</dd>
    </div>
  );
}

/** Historial de visitas: cada una muestra el tipo, la empresa y los datos que tenía al entrar (R17). */
export function VisitHistory({ visits }: { visits: VisitSummary[] }) {
  if (visits.length === 0) {
    return <p className="text-sm text-ink-muted">Esta persona todavía no tiene visitas.</p>;
  }
  return (
    <ol className="divide-y divide-line-soft rounded-lg border border-line text-sm">
      {visits.map((visit) => {
        const columns = visitColumnsFor(visit.personType);
        return (
          <li key={visit.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold tabular-nums text-ink">
                {formatDateTime(visit.entryAt)}
                {' → '}
                {visit.exitAt ? formatDateTime(visit.exitAt) : 'sin salida'}
              </span>
              {visit.exitAt ? (
                <Badge>Salida registrada</Badge>
              ) : (
                <Badge tone="success">Dentro</Badge>
              )}
            </div>
            <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-ink-muted sm:grid-cols-2">
              <Detail label="Tipo">{PERSON_TYPE_LABEL[visit.personType]}</Detail>
              <Detail label="Empresa">{visit.company.name}</Detail>
              {columns.purpose && <Detail label="Motivo">{visit.purpose}</Detail>}
              {columns.area && <Detail label="Área">{visit.area}</Detail>}
            </dl>
            {columns.tools && (
              <p className="mt-1 text-ink-muted">
                <span className="font-medium text-ink-soft">Herramientas: </span>
                {visit.tools.length === 0 ? 'ninguna' : visit.tools.map(formatToolLabel).join(', ')}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
