import { Link } from 'react-router';
import { DaySummaryTiles } from './DaySummaryTiles';
import { InsideList } from './InsideList';
import { RecentActivity } from './RecentActivity';
import { useDashboardSummary, useInsideVisits } from './use-live-data';
import { Icon } from '../../components/atoms/Icon';
import { Card } from '../../components/molecules/Card';
import { ErrorState } from '../../components/molecules/ErrorState';

/** Personas dentro que se muestran en el inicio; el resto en la vista «Dentro». */
const INSIDE_PREVIEW = 8;

/**
 * Resumen del día, quién está dentro y actividad reciente (spec §14). En escritorio los dos
 * paneles llenan el alto que queda y se desplazan por dentro, no la página (ADR 0011).
 */
export function DashboardPanels() {
  const summary = useDashboardSummary();
  const inside = useInsideVisits();
  const visits = inside.data ?? [];

  return (
    <div className="flex flex-col gap-4 lg:flex-1">
      {summary.error && (
        <ErrorState message={summary.error.message} onRetry={() => void summary.refetch()} />
      )}
      {summary.data && <DaySummaryTiles summary={summary.data} />}

      <div className="grid gap-4 lg:min-h-72 lg:flex-1 lg:basis-0 lg:grid-cols-[58fr_42fr] lg:grid-rows-[minmax(0,1fr)]">
        <Card
          title="Personas dentro"
          icon="user"
          action={
            visits.length > 0 && (
              <Link
                to="/dentro"
                className="flex items-center gap-1 text-sm font-semibold text-primary-strong hover:underline"
              >
                Ver todas ({visits.length})
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            )
          }
          bodyClassName="min-h-0 flex-1 overflow-y-auto px-3 pb-3"
        >
          {inside.error && (
            <ErrorState message={inside.error.message} onRetry={() => void inside.refetch()} />
          )}
          {inside.data && visits.length === 0 && (
            <p className="px-1 text-sm text-ink-muted">No hay nadie dentro del CEDI.</p>
          )}
          {visits.length > 0 && <InsideList visits={visits.slice(0, INSIDE_PREVIEW)} />}
        </Card>

        <Card
          title="Actividad reciente"
          icon="clock"
          bodyClassName="flex min-h-0 flex-1 flex-col px-3 pb-3"
        >
          {summary.data && <RecentActivity items={summary.data.recentActivity} />}
        </Card>
      </div>
    </div>
  );
}
