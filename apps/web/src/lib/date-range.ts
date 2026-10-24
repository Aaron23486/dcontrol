/** Rango de días (AAAA-MM-DD, inclusivos); sin `from` ni `to` no se limita por fecha. */
export interface DateRange {
  from?: string;
  to?: string;
}

export type DatePreset = 'today' | 'last7' | 'month' | 'all';
export const DATE_PRESETS: DatePreset[] = ['today', 'last7', 'month', 'all'];

/** AAAA-MM-DD del día local de `date`. */
export function localDateString(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Rango de cada atajo. «Todo» no limita fechas. */
export function presetRange(preset: DatePreset, today: Date): DateRange {
  const to = localDateString(today);
  switch (preset) {
    case 'today':
      return { from: to, to };
    case 'last7':
      return { from: localDateString(addDays(today, -6)), to };
    case 'month':
      return { from: `${to.slice(0, 8)}01`, to };
    case 'all':
      return {};
  }
}

/** Atajo activo, si las fechas coinciden con alguno. */
export function activePreset(range: DateRange, today: Date): DatePreset | undefined {
  return DATE_PRESETS.find((preset) => {
    const candidate = presetRange(preset, today);
    return candidate.from === range.from && candidate.to === range.to;
  });
}

/** Lee el rango de la URL; sin fechas ni `range=all` aplica el atajo por defecto. */
export function rangeFromParams(
  params: URLSearchParams,
  today: Date,
  fallback: DatePreset,
): DateRange {
  return params.has('from') || params.has('to') || params.get('range') === 'all'
    ? { from: params.get('from') ?? undefined, to: params.get('to') ?? undefined }
    : presetRange(fallback, today);
}

/** Escribe el rango en la URL; sin fechas se marca `range=all` para no volver al defecto. */
export function rangeToParams({ from, to }: DateRange): Record<string, string> {
  if (!from && !to) return { range: 'all' };
  return { ...(from && { from }), ...(to && { to }) };
}
