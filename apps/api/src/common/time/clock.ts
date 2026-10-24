import { Global, Injectable, Module } from '@nestjs/common';

/** Hora actual del servidor. Inyectable para que las pruebas controlen el tiempo (D2, D3). */
export abstract class Clock {
  abstract now(): Date;
}

@Injectable()
export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

@Global()
@Module({
  providers: [{ provide: Clock, useClass: SystemClock }],
  exports: [Clock],
})
export class ClockModule {}

/** Fecha de calendario (AAAA-MM-DD) de un instante en la zona horaria del CEDI (D6). */
export function calendarDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Diferencia en ms entre la hora local de la zona y UTC en ese instante. */
function utcOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const localAsUtc = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );
  return localAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * Instante en que empezó (medianoche) el día del CEDI al que pertenece `instant` (D6).
 * Se recalcula el desfase en la medianoche estimada por si ese día cambia el horario.
 */
export function startOfDay(instant: Date, timeZone: string): Date {
  return startOfLocalDate(calendarDate(instant, timeZone), timeZone);
}

/** Instante en que empieza un día del CEDI dado como AAAA-MM-DD (D6). */
export function startOfLocalDate(date: string, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const midnightAsUtc = Date.UTC(year, month - 1, day);
  const estimate = midnightAsUtc - utcOffsetMs(new Date(midnightAsUtc), timeZone);
  return new Date(midnightAsUtc - utcOffsetMs(new Date(estimate), timeZone));
}

/** El día siguiente a AAAA-MM-DD, en el mismo formato. */
export function nextLocalDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}
