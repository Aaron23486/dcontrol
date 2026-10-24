import { PERSON_TYPE_LABEL, type VisitSummary } from '@cedi/shared';
import { Badge } from '../../components/atoms/Badge';
import { formatDateTime, formatToolLabel } from '../../lib/format';
import { visitColumnsFor } from './person-sections';

/** Historial de visitas: cada una muestra el tipo, la empresa y los datos que tenía al entrar (R17). */
export function VisitHistory({ visits }: { visits: VisitSummary[] }) {
  if (visits.length === 0) {
    return <p className="text-sm text-slate-500">Esta persona todavía no tiene visitas.</p>;
  }
  return (
    <ol className="space-y-3">
      {visits.map((visit) => {
        const columns = visitColumnsFor(visit.personType);
        return (
          <li key={visit.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
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
            <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-slate-600 sm:grid-cols-2">
              <div>
                <dt className="inline font-medium text-slate-700">Tipo: </dt>
                <dd className="inline">{PERSON_TYPE_LABEL[visit.personType]}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-slate-700">Empresa: </dt>
                <dd className="inline">{visit.company.name}</dd>
              </div>
              {columns.purpose && (
                <div>
                  <dt className="inline font-medium text-slate-700">Motivo: </dt>
                  <dd className="inline">{visit.purpose}</dd>
                </div>
              )}
              {columns.area && (
                <div>
                  <dt className="inline font-medium text-slate-700">Área: </dt>
                  <dd className="inline">{visit.area}</dd>
                </div>
              )}
            </dl>
            {columns.tools && (
              <div className="mt-2 text-slate-600">
                <span className="font-medium text-slate-700">Herramientas: </span>
                {visit.tools.length === 0 ? 'ninguna' : visit.tools.map(formatToolLabel).join(', ')}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
