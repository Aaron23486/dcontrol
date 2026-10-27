import type { DashboardSummary } from '@cedi/shared';
import { StatTile } from '../../components/molecules/StatTile';

/** Indicadores del día (FR-8). «Hoy» lo define la hora del CEDI (D6). */
export function DaySummaryTiles({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatTile label="Dentro ahora" value={summary.insideCount} icon="users" tone="primary" />
      <StatTile label="Entradas de hoy" value={summary.entriesToday} icon="enter" tone="success" />
      <StatTile label="Salidas de hoy" value={summary.exitsToday} icon="exit" tone="danger" />
      <StatTile
        label="Visitas sin salida de días anteriores"
        value={summary.forgottenCount}
        icon="clock"
        tone="warning"
        attention="Revisar y cerrar"
      />
    </div>
  );
}
