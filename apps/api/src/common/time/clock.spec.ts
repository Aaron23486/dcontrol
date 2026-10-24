import { describe, expect, it } from 'vitest';
import { calendarDate, nextLocalDate, startOfDay, startOfLocalDate } from './clock';

describe('calendarDate (D6)', () => {
  it('usa la zona horaria del CEDI, no UTC', () => {
    // 03:30 UTC del 23 es todavía el 22 en Ciudad de México (UTC-6).
    const instant = new Date('2026-10-23T03:30:00Z');
    expect(calendarDate(instant, 'America/Mexico_City')).toBe('2026-10-22');
    expect(calendarDate(instant, 'UTC')).toBe('2026-10-23');
  });
});

describe('startOfDay (D6)', () => {
  it('devuelve la medianoche local del CEDI expresada en UTC', () => {
    // 10:00 del 23 en Ciudad de México (UTC-6) → el día empezó a las 06:00 UTC.
    expect(startOfDay(new Date('2026-10-23T16:00:00Z'), 'America/Mexico_City').toISOString()).toBe(
      '2026-10-23T06:00:00.000Z',
    );
  });

  it('a las 23:30 locales (ya es el día siguiente en UTC) sigue siendo el mismo día local', () => {
    expect(startOfDay(new Date('2026-10-24T05:30:00Z'), 'America/Mexico_City').toISOString()).toBe(
      '2026-10-23T06:00:00.000Z',
    );
  });

  it('respeta los cambios de horario (Nueva York, día del cambio de marzo)', () => {
    // El 8 de marzo de 2026 la medianoche aún es EST (UTC-5).
    expect(startOfDay(new Date('2026-03-08T18:00:00Z'), 'America/New_York').toISOString()).toBe(
      '2026-03-08T05:00:00.000Z',
    );
  });
});

describe('startOfLocalDate y nextLocalDate', () => {
  it('convierte un día del CEDI al instante en que empieza', () => {
    expect(startOfLocalDate('2026-10-23', 'America/Mexico_City').toISOString()).toBe(
      '2026-10-23T06:00:00.000Z',
    );
  });

  it('avanza un día, también en fin de mes y de año', () => {
    expect(nextLocalDate('2026-10-31')).toBe('2026-11-01');
    expect(nextLocalDate('2026-12-31')).toBe('2027-01-01');
  });
});
