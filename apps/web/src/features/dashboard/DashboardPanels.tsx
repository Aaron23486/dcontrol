import { Link } from 'react-router';
import { DaySummaryTiles } from './DaySummaryTiles';
import { InsideList } from './InsideList';
import { RecentActivity } from './RecentActivity';
import { useDashboardSummary, useInsideVisits } from './use-live-data';
import { ErrorState } from '../../components/molecules/ErrorState';

/** Personas dentro que se muestran en el inicio; el resto en la vista «Dentro». */
const INSIDE_PREVIEW = 8;

/** Resumen del día, quién está dentro y actividad reciente (spec §14). */
export function DashboardPanels() {
  const summary = useDashboardSummary();
  const inside = useInsideVisits();
  const visits = inside.data ?? [];

  return (
    <div className="space-y-6">
      {summary.error && (
        <ErrorState message={summary.error.message} onRetry={() => void summary.refetch()} />
      )}
      {summary.data && <DaySummaryTiles summary={summary.data} />}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="inside-title" className="min-w-0 space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 id="inside-title" className="font-semibold">
              Personas dentro
            </h2>
            {visits.length > 0 && (
              <Link to="/dentro" className="text-sm text-slate-600 hover:underline">
                Ver todas ({visits.length})
              </Link>
            )}
          </div>
          {inside.error && (
            <ErrorState message={inside.error.message} onRetry={() => void inside.refetch()} />
          )}
          {inside.data && visits.length === 0 && (
            <p className="text-sm text-slate-500">No hay nadie dentro del CEDI.</p>
          )}
          {visits.length > 0 && <InsideList visits={visits.slice(0, INSIDE_PREVIEW)} />}
        </section>

        <section aria-labelledby="activity-title" className="min-w-0 space-y-2">
          <h2 id="activity-title" className="font-semibold">
            Actividad reciente
          </h2>
          {summary.data && <RecentActivity items={summary.data.recentActivity} />}
        </section>
      </div>
    </div>
  );
}
