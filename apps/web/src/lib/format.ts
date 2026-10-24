const dateTime = new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' });

/** Fecha y hora local legible, p. ej. «23/10/26, 14:05». */
export const formatDateTime = (iso: string): string => dateTime.format(new Date(iso));

/** Construye `?a=1&b=2` omitiendo valores vacíos. */
export function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

/** Valor para `<input type="datetime-local">` en la hora local del navegador. */
export function toDateTimeLocal(iso: string): string {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

const time = new Intl.DateTimeFormat('es', { timeStyle: 'short' });

/** Solo la hora, p. ej. «14:05». */
export const formatTime = (iso: string): string => time.format(new Date(iso));

/** Tiempo transcurrido legible: «35 min», «2 h 05 min», «1 d 3 h». */
export function formatDuration(fromIso: string, now: Date): string {
  const totalMinutes = Math.max(
    0,
    Math.floor((now.getTime() - new Date(fromIso).getTime()) / 60_000),
  );
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${String(minutes).padStart(2, '0')} min`;
  return `${minutes} min`;
}

/** ¿El instante cae en el mismo día local que `now`? */
export function isSameLocalDay(iso: string, now: Date): boolean {
  return new Date(iso).toDateString() === now.toDateString();
}

const date = new Intl.DateTimeFormat('es', { dateStyle: 'short' });

/** Solo la fecha, p. ej. «23/10/26». */
export const formatDate = (iso: string): string => date.format(new Date(iso));

/** Herramienta legible: «Taladro ×2 · inalámbrico». */
export function formatToolLabel(tool: {
  name: string;
  description: string | null;
  quantity: number | null;
}): string {
  const quantity = tool.quantity ? ` ×${tool.quantity}` : '';
  const description = tool.description ? ` · ${tool.description}` : '';
  return `${tool.name}${quantity}${description}`;
}
