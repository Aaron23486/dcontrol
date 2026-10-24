import { PERSON_TYPE_LABEL, type ActivityItem } from '@cedi/shared';
import { Icon } from '../../components/atoms/Icon';
import { formatDateTime, formatTime, isSameLocalDay } from '../../lib/format';
import { useNow } from '../../lib/use-now';

/**
 * Últimas entradas y salidas, de la más reciente a la más antigua. La lista se desplaza dentro
 * de su panel: en escritorio llena el alto disponible; en pantallas chicas, hasta 24 rem.
 */
export function RecentActivity({ items }: { items: ActivityItem[] }) {
  const now = useNow();
  if (items.length === 0) {
    return <p className="px-1 text-sm text-ink-muted">Todavía no hay movimientos.</p>;
  }
  return (
    // tabIndex: con el teclado también se puede desplazar la lista (WCAG 2.1.1).
    <ol
      aria-label="Últimos movimientos"
      tabIndex={0}
      className="max-h-96 divide-y divide-line-soft overflow-y-auto rounded-lg border border-line text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:max-h-none lg:min-h-0 lg:flex-1"
    >
      {items.map((item) => {
        const entry = item.kind === 'ENTRY';
        return (
          <li key={`${item.visitId}-${item.kind}`} className="flex items-center gap-2 px-3 py-1">
            <span
              className={`flex w-21 shrink-0 items-center gap-1.5 text-[11px] font-bold tracking-wide ${
                entry ? 'text-success-strong' : 'text-primary-strong'
              }`}
            >
              <Icon name={entry ? 'arrowRight' : 'arrowLeft'} className="h-4 w-4" />
              {entry ? 'ENTRADA' : 'SALIDA'}
            </span>
            <span className="min-w-0 flex-1 truncate leading-5">
              <span className="font-semibold text-ink">{item.personName}</span>
              <span className="text-ink-muted">
                {' '}
                · {PERSON_TYPE_LABEL[item.personType]} · {item.company.name}
              </span>
            </span>
            <time dateTime={item.at} className="shrink-0 tabular-nums text-ink-muted">
              {/* Movimientos de otro día llevan fecha para no confundirlos con los de hoy. */}
              {isSameLocalDay(item.at, now) ? formatTime(item.at) : formatDateTime(item.at)}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
