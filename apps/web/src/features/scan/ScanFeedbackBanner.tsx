import { formatDateTime, formatToolLabel } from '../../lib/format';
import type { ScanFeedback } from './use-scan-flow';

const STYLES = {
  entry: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  exit: 'border-sky-300 bg-sky-50 text-sky-900',
  error: 'border-red-300 bg-red-50 text-red-900',
} as const;

/** Mensaje grande y claro de lo que se registró (spec §25). */
export function ScanFeedbackBanner({ feedback }: { feedback: ScanFeedback }) {
  return (
    <div
      role={feedback.kind === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border-2 px-5 py-4 ${STYLES[feedback.kind]}`}
    >
      {feedback.kind === 'error' ? (
        <p className="font-medium">{feedback.message}</p>
      ) : (
        <>
          <p className="text-2xl font-bold tracking-wide">
            {feedback.kind === 'entry' ? 'ENTRADA registrada' : 'SALIDA registrada'}
          </p>
          <p className="mt-1">
            {feedback.personName} · {formatDateTime(feedback.at)}
          </p>
          {feedback.kind === 'exit' && feedback.tools.length > 0 && (
            <ExitToolsCheck tools={feedback.tools} />
          )}
        </>
      )}
    </div>
  );
}

/** Fase 7: herramientas con que entró el técnico, para verificar que salgan con él. */
function ExitToolsCheck({ tools }: { tools: Parameters<typeof formatToolLabel>[0][] }) {
  return (
    <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950">
      <p className="flex items-center gap-2 font-semibold">
        <span aria-hidden="true">⚠</span>
        Verifica que salga con las herramientas que ingresó:
      </p>
      <ul className="mt-2 list-disc space-y-0.5 pl-6">
        {tools.map((tool, index) => (
          <li key={index}>{formatToolLabel(tool)}</li>
        ))}
      </ul>
    </div>
  );
}
