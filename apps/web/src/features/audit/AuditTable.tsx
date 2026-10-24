import {
  AUDIT_ACTION_LABEL,
  AUDIT_FIELD_LABEL,
  AuditEntity,
  type AuditLogItem,
} from '@cedi/shared';
import { Link } from 'react-router';
import { formatDateTime } from '../../lib/format';

const TH = 'px-3 py-2';

/** Sobre qué registro fue la acción, con enlace a la persona o a la visita. */
function TargetCell({ target }: { target: AuditLogItem['target'] }) {
  if (!target.person) return <span className="text-slate-500">Registro no disponible</span>;
  return (
    <>
      <Link to={`/personas/detalle/${target.person.id}`} className="font-medium hover:underline">
        {target.person.fullName}
      </Link>
      <span className="block text-xs text-slate-500">
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
    <div className="relative overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th scope="col" className={TH}>
              Fecha y hora
            </th>
            <th scope="col" className={TH}>
              Usuario
            </th>
            <th scope="col" className={TH}>
              Acción
            </th>
            <th scope="col" className={TH}>
              Sobre
            </th>
            <th scope="col" className={TH}>
              Campos modificados
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="whitespace-nowrap px-3 py-2">{formatDateTime(item.createdAt)}</td>
              <td className="px-3 py-2">
                {item.user.name}
                <span className="block text-xs text-slate-500">{item.user.email}</span>
              </td>
              <td className="px-3 py-2">{AUDIT_ACTION_LABEL[item.action]}</td>
              <td className="px-3 py-2">
                <TargetCell target={item.target} />
              </td>
              <td className="px-3 py-2">
                {item.changedFields.length > 0
                  ? item.changedFields.map((field) => AUDIT_FIELD_LABEL[field] ?? field).join(', ')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
