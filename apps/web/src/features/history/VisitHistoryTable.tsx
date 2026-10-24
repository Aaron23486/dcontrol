import type { PersonType, VisitListItem } from '@cedi/shared';
import { Link } from 'react-router';
import { Badge } from '../../components/atoms/Badge';
import { formatDate, formatDuration, formatTime } from '../../lib/format';
import { visitColumnsFor } from '../persons/person-sections';

interface VisitHistoryTableProps {
  type: PersonType;
  visits: VisitListItem[];
}

const TH = 'px-3 py-2';

/** Historial de una sección: columnas comunes más las propias de su tipo (spec §16, ADR 0009). */
export function VisitHistoryTable({ type, visits }: VisitHistoryTableProps) {
  const columns = visitColumnsFor(type);
  return (
    <div className="relative overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th scope="col" className={TH}>
              Persona
            </th>
            <th scope="col" className={TH}>
              Empresa
            </th>
            <th scope="col" className={TH}>
              Fecha
            </th>
            <th scope="col" className={TH}>
              Entrada
            </th>
            <th scope="col" className={TH}>
              Salida
            </th>
            <th scope="col" className={TH}>
              Duración
            </th>
            <th scope="col" className={TH}>
              Estado
            </th>
            {columns.purpose && (
              <th scope="col" className={TH}>
                Motivo
              </th>
            )}
            {columns.area && (
              <th scope="col" className={TH}>
                Área
              </th>
            )}
            {columns.tools && (
              <th scope="col" className={TH}>
                Herramientas
              </th>
            )}
            <th scope="col" className={TH}>
              <span className="sr-only">Detalle</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visits.map((visit) => (
            <tr key={visit.id} className="hover:bg-slate-50">
              <td className="px-3 py-2">
                <Link
                  to={`/personas/detalle/${visit.person.id}`}
                  className="font-medium hover:underline"
                >
                  {visit.person.fullName}
                </Link>
                <span className="block font-mono text-xs text-slate-500">
                  {visit.person.identification}
                </span>
              </td>
              <td className="px-3 py-2">{visit.company.name}</td>
              <td className="whitespace-nowrap px-3 py-2">{formatDate(visit.entryAt)}</td>
              <td className="whitespace-nowrap px-3 py-2">{formatTime(visit.entryAt)}</td>
              <td className="whitespace-nowrap px-3 py-2">
                {visit.exitAt ? formatTime(visit.exitAt) : '—'}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {visit.exitAt ? formatDuration(visit.entryAt, new Date(visit.exitAt)) : '—'}
              </td>
              <td className="px-3 py-2">
                {visit.exitAt ? (
                  <Badge>Salida registrada</Badge>
                ) : (
                  <Badge tone="success">Dentro</Badge>
                )}
              </td>
              {columns.purpose && <td className="px-3 py-2">{visit.purpose}</td>}
              {columns.area && <td className="px-3 py-2">{visit.area}</td>}
              {columns.tools && <td className="px-3 py-2">{visit.tools.length || '—'}</td>}
              <td className="px-3 py-2 text-right">
                <Link
                  to={`/historial/visita/${visit.id}`}
                  className="text-slate-600 hover:underline"
                  aria-label={`Ver detalle de la visita de ${visit.person.fullName} del ${formatDate(visit.entryAt)}`}
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
