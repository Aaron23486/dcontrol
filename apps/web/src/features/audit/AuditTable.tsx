import {
  AUDIT_ACTION_LABEL,
  AUDIT_FIELD_LABEL,
  AuditAction,
  AuditEntity,
  type AuditLogItem,
} from '@cedi/shared';
import { Link } from 'react-router';
import { Icon, type IconName } from '../../components/atoms/Icon';
import { DataTable, Td, Th } from '../../components/molecules/DataTable';
import { formatDateTime } from '../../lib/format';

/** Ícono y color de cada acción: ayudan a distinguirlas, el texto siempre las nombra (spec §28). */
const ACTION_STYLE: Record<AuditAction, { icon: IconName; color: string }> = {
  [AuditAction.PERSON_CREATED]: { icon: 'userPlus', color: 'text-primary' },
  [AuditAction.PERSON_UPDATED]: { icon: 'edit', color: 'text-ink-muted' },
  [AuditAction.VISIT_ENTRY_REGISTERED]: { icon: 'enter', color: 'text-success' },
  [AuditAction.VISIT_EXIT_REGISTERED]: { icon: 'exit', color: 'text-primary' },
  [AuditAction.VISIT_CLOSED_MANUALLY]: { icon: 'alert', color: 'text-warning' },
};

/** Sobre qué registro fue la acción, con enlace a la persona o a la visita. */
function TargetCell({ target }: { target: AuditLogItem['target'] }) {
  if (!target.person) return <span className="text-ink-muted">Registro no disponible</span>;
  return (
    <>
      <Link
        to={`/personas/detalle/${target.person.id}`}
        className="font-semibold text-ink hover:text-primary-strong hover:underline"
      >
        {target.person.fullName}
      </Link>
      <span className="block text-xs text-ink-muted">
        <span className="font-mono">{target.person.identification}</span>
        {target.entity === AuditEntity.VISIT && target.visitEntryAt && (
          <>
            {' · '}
            <Link to={`/historial/visita/${target.id}`} className="hover:underline">
              visita del {formatDateTime(target.visitEntryAt)}
            </Link>
          </>
        )}
      </span>
    </>
  );
}

/** Registro de auditoría: quién, qué, cuándo y sobre qué (spec §19, D12). */
export function AuditTable({ items }: { items: AuditLogItem[] }) {
  return (
    <DataTable
      head={
        <>
          <Th>Fecha y hora</Th>
          <Th>Usuario</Th>
          <Th>Acción</Th>
          <Th>Sobre</Th>
          <Th>Campos modificados</Th>
        </>
      }
    >
      {items.map((item) => {
        const style = ACTION_STYLE[item.action];
        return (
          <tr key={item.id} className="hover:bg-canvas/70">
            <Td className="whitespace-nowrap tabular-nums">{formatDateTime(item.createdAt)}</Td>
            <Td>
              <span className="font-medium">{item.user.name}</span>
              <span className="block text-xs text-ink-muted">{item.user.email}</span>
            </Td>
            <Td>
              <span className="inline-flex items-center gap-2 whitespace-nowrap font-medium">
                <Icon name={style.icon} className={`h-4 w-4 ${style.color}`} />
                {AUDIT_ACTION_LABEL[item.action]}
              </span>
            </Td>
            <Td>
              <TargetCell target={item.target} />
            </Td>
            <Td className="text-ink-soft">
              {item.changedFields.length > 0
                ? item.changedFields.map((field) => AUDIT_FIELD_LABEL[field] ?? field).join(', ')
                : '—'}
            </Td>
          </tr>
        );
      })}
    </DataTable>
  );
}
