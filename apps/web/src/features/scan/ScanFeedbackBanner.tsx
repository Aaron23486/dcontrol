import { Icon, type IconName } from '../../components/atoms/Icon';
import { formatDateTime, formatToolLabel } from '../../lib/format';
import type { ScanFeedback } from './use-scan-flow';

const STYLES: Record<ScanFeedback['kind'], { box: string; icon: IconName }> = {
  entry: { box: 'border-success/40 bg-success-soft text-success-strong', icon: 'enter' },
  exit: { box: 'border-primary/30 bg-primary-soft text-primary-strong', icon: 'exit' },
  error: { box: 'border-danger/30 bg-danger-soft text-danger-strong', icon: 'alert' },
};

/** Mensaje grande y claro de lo que se registró (NFR-2). */
export function ScanFeedbackBanner({ feedback }: { feedback: ScanFeedback }) {
  const style = STYLES[feedback.kind];
  return (
    <div
      role={feedback.kind === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-card border-2 px-5 py-3 ${style.box}`}
    >
      <Icon name={style.icon} className="mt-0.5 h-7 w-7" />
      <div className="min-w-0 flex-1">
        {feedback.kind === 'error' ? (
          <p className="py-0.5 font-semibold">{feedback.message}</p>
        ) : (
          <>
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="text-xl font-bold tracking-wide">
                {feedback.kind === 'entry' ? 'ENTRADA registrada' : 'SALIDA registrada'}
              </span>
              <span className="text-ink">
                {feedback.personName} · {formatDateTime(feedback.at)}
              </span>
            </p>
            {feedback.kind === 'exit' && feedback.tools.length > 0 && (
              <ExitToolsCheck tools={feedback.tools} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** FR-12: herramientas con que entró el técnico, para verificar que salgan con él. */
function ExitToolsCheck({ tools }: { tools: Parameters<typeof formatToolLabel>[0][] }) {
  return (
    <div className="mt-2 rounded-lg border border-warning/40 bg-warning-soft px-4 py-2.5 text-warning-strong">
      <p className="flex items-center gap-2 font-semibold">
        <Icon name="alert" className="h-4 w-4" />
        Verifica que salga con las herramientas que ingresó:
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-6 text-ink">
        {tools.map((tool, index) => (
          <li key={index}>{formatToolLabel(tool)}</li>
        ))}
      </ul>
    </div>
  );
}
