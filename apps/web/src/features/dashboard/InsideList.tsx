import { PERSON_TYPE_LABEL, type InsideVisit } from '@cedi/shared';
import { Link } from 'react-router';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { DataTable, Td, Th } from '../../components/molecules/DataTable';
import { formatDateTime, formatDuration, formatTime } from '../../lib/format';
import { useNow } from '../../lib/use-now';

interface InsideListProps {
  visits: InsideVisit[];
  /** Si se indica, las visitas de días anteriores ofrecen «Cerrar visita» (D3). */
  onClose?: (visit: InsideVisit) => void;
}

/** ¿Quién está dentro del CEDI ahora? (FR-11) */
export function InsideList({ visits, onClose }: InsideListProps) {
  const now = useNow();
  return (
    <DataTable
      head={
        <>
          <Th>Nombre</Th>
          <Th>Tipo</Th>
          <Th>Empresa</Th>
          <Th>Entrada</Th>
          <Th>Tiempo dentro</Th>
          <Th>Estado</Th>
          {onClose && (
            <Th>
              <span className="sr-only">Acciones</span>
            </Th>
          )}
        </>
      }
    >
      {visits.map((visit) => (
        <tr
          key={visit.visitId}
          className={visit.isFromPreviousDay ? 'bg-warning-soft/60' : undefined}
        >
          <Td>
            <Link
              to={`/personas/detalle/${visit.person.id}`}
              className="font-semibold text-ink hover:text-primary-strong hover:underline"
            >
              {visit.person.fullName}
            </Link>
            <span className="block text-xs text-ink-muted">{visit.person.identification}</span>
          </Td>
          <Td>{PERSON_TYPE_LABEL[visit.personType]}</Td>
          <Td>{visit.company.name}</Td>
          <Td className="whitespace-nowrap tabular-nums">
            {visit.isFromPreviousDay ? formatDateTime(visit.entryAt) : formatTime(visit.entryAt)}
          </Td>
          <Td className="whitespace-nowrap tabular-nums">{formatDuration(visit.entryAt, now)}</Td>
          <Td>
            {visit.isFromPreviousDay ? (
              <Badge tone="warning">Sin salida desde otro día</Badge>
            ) : (
              <Badge tone="success">Dentro</Badge>
            )}
          </Td>
          {onClose && (
            <Td className="text-right">
              {visit.isFromPreviousDay && (
                <Button variant="secondary" onClick={() => onClose(visit)}>
                  Cerrar visita
                </Button>
              )}
            </Td>
          )}
        </tr>
      ))}
    </DataTable>
  );
}
