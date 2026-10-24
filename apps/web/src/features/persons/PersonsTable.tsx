import type { PersonSummary, PersonType } from '@cedi/shared';
import { Link } from 'react-router';
import { Badge } from '../../components/atoms/Badge';
import { DataTable, Td, Th } from '../../components/molecules/DataTable';
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
    <DataTable
      head={
        <>
          <Th>Nombre</Th>
          <Th>Cédula</Th>
          <Th>Empresa</Th>
          <Th>Estado</Th>
          <Th>Última visita</Th>
          {columns.purpose && <Th>Último motivo</Th>}
          {columns.area && <Th>Última área</Th>}
          {columns.tools && <Th>Herramientas</Th>}
        </>
      }
    >
      {persons.map((person) => (
        <tr key={person.id} className="hover:bg-canvas/70">
          <Td>
            <Link
              to={`/personas/detalle/${person.id}`}
              className="whitespace-nowrap font-semibold text-ink hover:text-primary-strong hover:underline"
            >
              {person.fullName}
            </Link>
          </Td>
          <Td className="tabular-nums text-ink-soft">{person.identification}</Td>
          <Td>{person.company.name}</Td>
          <Td>{person.isInside ? <Badge tone="success">Dentro</Badge> : <Badge>Fuera</Badge>}</Td>
          <Td className="whitespace-nowrap tabular-nums">
            {person.lastVisit ? formatDateTime(person.lastVisit.entryAt) : 'Sin visitas'}
          </Td>
          {columns.purpose && <Td>{person.lastVisit?.purpose ?? '—'}</Td>}
          {columns.area && <Td>{person.lastVisit?.area ?? '—'}</Td>}
          {columns.tools && (
            <Td className="tabular-nums">{person.lastVisit ? person.lastVisit.toolsCount : '—'}</Td>
          )}
        </tr>
      ))}
    </DataTable>
  );
}
