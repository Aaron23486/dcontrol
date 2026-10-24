import type { DashboardSummary } from '@cedi/shared';
import { StatTile } from '../../components/molecules/StatTile';

/** Indicadores del día (spec §14). «Hoy» lo define la hora del CEDI (D6). */
export function DaySummaryTiles({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile label="Dentro ahora" value={summary.insideCount} hero />
      <StatTile label="Entradas de hoy" value={summary.entriesToday} />
      <StatTile label="Salidas de hoy" value={summary.exitsToday} />
      <StatTile
        label="Visitas sin salida de días anteriores"
        value={summary.forgottenCount}
        attention="Revisar y cerrar"
      />
    </div>
  );
}
