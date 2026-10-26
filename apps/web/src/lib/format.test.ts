import { describe, expect, it } from 'vitest';
import {
  formatCount,
  formatDuration,
  isSameLocalDay,
  toDateTimeLocal,
  toQueryString,
} from './format';

describe('formatDuration', () => {
  const now = new Date('2026-10-23T16:00:00Z');

  it('minutos', () => {
    expect(formatDuration('2026-10-23T15:25:00Z', now)).toBe('35 min');
  });

  it('horas y minutos con dos dígitos', () => {
    expect(formatDuration('2026-10-23T13:55:00Z', now)).toBe('2 h 05 min');
  });

  it('días y horas para visitas olvidadas', () => {
    expect(formatDuration('2026-10-22T13:00:00Z', now)).toBe('1 d 3 h');
  });

  it('nunca negativo si los relojes difieren', () => {
    expect(formatDuration('2026-10-23T16:01:00Z', now)).toBe('0 min');
  });
});

describe('toQueryString', () => {
  it('omite valores vacíos', () => {
    expect(toQueryString({ a: 'x', b: '', c: undefined, d: 2 })).toBe('?a=x&d=2');
  });
});

describe('fechas locales', () => {
  it('toDateTimeLocal da el valor para <input type="datetime-local"> en hora local', () => {
    const local = new Date(2026, 9, 22, 18, 30);
    expect(toDateTimeLocal(local.toISOString())).toBe('2026-10-22T18:30');
  });

  it('isSameLocalDay compara el día local', () => {
    const now = new Date(2026, 9, 23, 9, 0);
    expect(isSameLocalDay(new Date(2026, 9, 23, 23, 59).toISOString(), now)).toBe(true);
    expect(isSameLocalDay(new Date(2026, 9, 22, 23, 59).toISOString(), now)).toBe(false);
  });
});

describe('formatCount', () => {
  const persona = { one: 'persona', other: 'personas' };

  it('usa el singular solo para 1', () => {
    expect(formatCount(1, persona)).toBe('1 persona');
    expect(formatCount(0, persona)).toBe('0 personas');
    expect(formatCount(12, persona)).toBe('12 personas');
  });
});
