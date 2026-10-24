import type { PersonType, VisitListItem } from '@cedi/shared';
import { Link } from 'react-router';
import { Badge } from '../../components/atoms/Badge';
import { Icon } from '../../components/atoms/Icon';
import { DataTable, Td, Th } from '../../components/molecules/DataTable';
import { formatDate, formatDuration, formatTime } from '../../lib/format';
import { visitColumnsFor } from '../persons/person-sections';

interface VisitHistoryTableProps {
  type: PersonType;
  visits: VisitListItem[];
}

/** Historial de una sección: columnas comunes más las propias de su tipo (spec §16, ADR 0009). */
export function VisitHistoryTable({ type, visits }: VisitHistoryTableProps) {
  const columns = visitColumnsFor(type);
  return (
    <DataTable
      head={
        <>
          <Th>Persona</Th>
          <Th>Empresa</Th>
          <Th>Fecha</Th>
          <Th>Entrada</Th>
          <Th>Salida</Th>
          <Th>Duración</Th>
          <Th>Estado</Th>
          {columns.purpose && <Th>Motivo</Th>}
          {columns.area && <Th>Área</Th>}
          {columns.tools && <Th>Herramientas</Th>}
          <Th>
            <span className="sr-only">Detalle</span>
          </Th>
        </>
      }
    >
      {visits.map((visit) => (
        <tr key={visit.id} className="hover:bg-canvas/70">
          <Td>
            <Link
              to={`/personas/detalle/${visit.person.id}`}
              className="whitespace-nowrap font-semibold text-ink hover:text-primary-strong hover:underline"
            >
              {visit.person.fullName}
            </Link>
            <span className="block text-xs text-ink-muted">{visit.person.identification}</span>
          </Td>
          <Td>{visit.company.name}</Td>
          <Td className="whitespace-nowrap tabular-nums">{formatDate(visit.entryAt)}</Td>
          <Td className="whitespace-nowrap tabular-nums">{formatTime(visit.entryAt)}</Td>
          <Td className="whitespace-nowrap tabular-nums">
            {visit.exitAt ? formatTime(visit.exitAt) : '—'}
          </Td>
          <Td className="whitespace-nowrap tabular-nums">
            {visit.exitAt ? formatDuration(visit.entryAt, new Date(visit.exitAt)) : '—'}
          </Td>
          <Td>
            {visit.exitAt ? <Badge>Salida registrada</Badge> : <Badge tone="success">Dentro</Badge>}
          </Td>
          {columns.purpose && <Td>{visit.purpose}</Td>}
          {columns.area && <Td>{visit.area}</Td>}
          {columns.tools && <Td className="tabular-nums">{visit.tools.length || '—'}</Td>}
          <Td className="text-right">
            <Link
              to={`/historial/visita/${visit.id}`}
              className="inline-flex min-h-10 items-center gap-0.5 font-semibold text-primary-strong hover:underline"
              aria-label={`Ver detalle de la visita de ${visit.person.fullName} del ${formatDate(visit.entryAt)}`}
            >
              Ver
              <Icon name="chevronRight" className="h-4 w-4" />
            </Link>
          </Td>
        </tr>
      ))}
    </DataTable>
  );
}
