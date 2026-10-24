import type { PersonSummary, PersonType } from '@cedi/shared';
import { Link } from 'react-router';
import { Badge } from '../../components/atoms/Badge';
import { formatDateTime } from '../../lib/format';
import { visitColumnsFor } from './person-sections';

interface PersonsTableProps {
  type: PersonType;
  persons: PersonSummary[];
}

/** Tabla de una sección: columnas comunes más las propias de su tipo (spec §7 y §15). */
export function PersonsTable({ type, persons }: PersonsTableProps) {
  const columns = visitColumnsFor(type);
  return (
    <div className="relative overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th scope="col" className="px-3 py-2">
              Nombre
            </th>
            <th scope="col" className="px-3 py-2">
              Cédula
            </th>
            <th scope="col" className="px-3 py-2">
              Empresa
            </th>
            <th scope="col" className="px-3 py-2">
              Estado
            </th>
            <th scope="col" className="px-3 py-2">
              Última visita
            </th>
            {columns.purpose && (
              <th scope="col" className="px-3 py-2">
                Último motivo
              </th>
            )}
            {columns.area && (
              <th scope="col" className="px-3 py-2">
                Última área
              </th>
            )}
            {columns.tools && (
              <th scope="col" className="px-3 py-2">
                Herramientas
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {persons.map((person) => (
            <tr key={person.id} className="hover:bg-slate-50">
              <td className="px-3 py-2 font-medium">
                <Link to={`/personas/detalle/${person.id}`} className="hover:underline">
                  {person.fullName}
                </Link>
              </td>
              <td className="px-3 py-2 font-mono">{person.identification}</td>
              <td className="px-3 py-2">{person.company.name}</td>
              <td className="px-3 py-2">
                {person.isInside ? <Badge tone="success">Dentro</Badge> : <Badge>Fuera</Badge>}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {person.lastVisit ? formatDateTime(person.lastVisit.entryAt) : 'Sin visitas'}
              </td>
              {columns.purpose && <td className="px-3 py-2">{person.lastVisit?.purpose ?? '—'}</td>}
              {columns.area && <td className="px-3 py-2">{person.lastVisit?.area ?? '—'}</td>}
              {columns.tools && (
                <td className="px-3 py-2">
                  {person.lastVisit ? person.lastVisit.toolsCount : '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
