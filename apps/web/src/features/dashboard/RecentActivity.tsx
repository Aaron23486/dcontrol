import { PERSON_TYPE_LABEL, type ActivityItem } from '@cedi/shared';
import { formatDateTime, formatTime, isSameLocalDay } from '../../lib/format';
import { useNow } from '../../lib/use-now';

/** Últimas entradas y salidas, de la más reciente a la más antigua. */
export function RecentActivity({ items }: { items: ActivityItem[] }) {
  const now = useNow();
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no hay movimientos.</p>;
  }
  return (
    <ol className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white text-sm">
      {items.map((item) => (
        <li key={`${item.visitId}-${item.kind}`} className="flex items-center gap-3 px-3 py-2">
          <span
            className={`w-20 shrink-0 whitespace-nowrap text-xs font-bold tracking-wide ${
              item.kind === 'ENTRY' ? 'text-emerald-700' : 'text-sky-700'
            }`}
          >
            {item.kind === 'ENTRY' ? '→ ENTRADA' : '← SALIDA'}
          </span>
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium">{item.personName}</span>
            <span className="text-slate-500">
              {' '}
              · {PERSON_TYPE_LABEL[item.personType]} · {item.company.name}
            </span>
          </span>
          <time dateTime={item.at} className="shrink-0 text-slate-600">
            {/* Movimientos de otro día llevan fecha para no confundirlos con los de hoy. */}
            {isSameLocalDay(item.at, now) ? formatTime(item.at) : formatDateTime(item.at)}
          </time>
        </li>
      ))}
    </ol>
  );
}
