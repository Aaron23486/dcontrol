import { describe, expect, it } from 'vitest';
import { activePreset, presetRange, rangeFromParams, rangeToParams } from './date-range';

// Mediodía local para que la prueba no dependa de la zona horaria de la máquina.
const today = new Date(2026, 9, 23, 12, 0);

describe('presetRange', () => {
  it('hoy, últimos 7 días, este mes y todo', () => {
    expect(presetRange('today', today)).toEqual({ from: '2026-10-23', to: '2026-10-23' });
    expect(presetRange('last7', today)).toEqual({ from: '2026-10-17', to: '2026-10-23' });
    expect(presetRange('month', today)).toEqual({ from: '2026-10-01', to: '2026-10-23' });
    expect(presetRange('all', today)).toEqual({});
  });
});

describe('rango en la URL', () => {
  it('sin parámetros aplica el atajo por defecto', () => {
    expect(rangeFromParams(new URLSearchParams(), today, 'last7')).toEqual({
      from: '2026-10-17',
      to: '2026-10-23',
    });
  });

  it('«todo» se conserva al ida y vuelta por la URL', () => {
    const params = rangeToParams({});
    expect(params).toEqual({ range: 'all' });
    expect(rangeFromParams(new URLSearchParams(params), today, 'today')).toEqual({
      from: undefined,
      to: undefined,
    });
  });

  it('reconoce el atajo activo', () => {
    expect(activePreset({ from: '2026-10-17', to: '2026-10-23' }, today)).toBe('last7');
    expect(activePreset({ from: '2026-10-05', to: '2026-10-06' }, today)).toBeUndefined();
  });
});
