import { PERSON_TYPE_LABEL, type InsideVisit } from '@cedi/shared';
import { Link } from 'react-router';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { formatDateTime, formatDuration, formatTime } from '../../lib/format';
import { useNow } from '../../lib/use-now';

interface InsideListProps {
  visits: InsideVisit[];
  /** Si se indica, las visitas de días anteriores ofrecen «Cerrar visita» (D3). */
  onClose?: (visit: InsideVisit) => void;
}

/** ¿Quién está dentro del CEDI ahora? (spec §17) */
export function InsideList({ visits, onClose }: InsideListProps) {
  const now = useNow();
  return (
    <div className="relative overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th scope="col" className="px-3 py-2">
              Nombre
            </th>
            <th scope="col" className="px-3 py-2">
              Tipo
            </th>
            <th scope="col" className="px-3 py-2">
              Empresa
            </th>
            <th scope="col" className="px-3 py-2">
              Entrada
            </th>
            <th scope="col" className="px-3 py-2">
              Tiempo dentro
            </th>
            <th scope="col" className="px-3 py-2">
              Estado
            </th>
            {onClose && (
              <th scope="col" className="px-3 py-2">
                <span className="sr-only">Acciones</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visits.map((visit) => (
            <tr key={visit.visitId} className={visit.isFromPreviousDay ? 'bg-amber-50' : undefined}>
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
              <td className="px-3 py-2">{PERSON_TYPE_LABEL[visit.personType]}</td>
              <td className="px-3 py-2">{visit.company.name}</td>
              <td className="whitespace-nowrap px-3 py-2">
                {visit.isFromPreviousDay
                  ? formatDateTime(visit.entryAt)
                  : formatTime(visit.entryAt)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">{formatDuration(visit.entryAt, now)}</td>
              <td className="px-3 py-2">
                {visit.isFromPreviousDay ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                    <span aria-hidden="true">⚠</span> Sin salida desde otro día
                  </span>
                ) : (
                  <Badge tone="success">Dentro</Badge>
                )}
              </td>
              {onClose && (
                <td className="px-3 py-2 text-right">
                  {visit.isFromPreviousDay && (
                    <Button variant="secondary" onClick={() => onClose(visit)}>
                      Cerrar visita
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
