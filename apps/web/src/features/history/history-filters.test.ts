import { describe, expect, it } from 'vitest';
import { filtersFromParams, paramsFromFilters } from './history-filters';

const today = new Date(2026, 9, 23, 12, 0);

describe('filtros del historial en la URL', () => {
  it('sin parámetros muestra las visitas de hoy', () => {
    expect(filtersFromParams(new URLSearchParams(), today)).toMatchObject({
      from: '2026-10-23',
      to: '2026-10-23',
      page: 1,
    });
  });

  it('ignora un estado desconocido y una página inválida', () => {
    expect(
      filtersFromParams(new URLSearchParams('status=OTRO&page=-3&q=ana'), today),
    ).toMatchObject({ status: undefined, page: 1, q: 'ana' });
  });

  it('escribe solo lo necesario', () => {
    expect(paramsFromFilters({ page: 1 })).toEqual({ range: 'all' });
    expect(
      paramsFromFilters({
        from: '2026-10-01',
        to: '2026-10-23',
        status: 'INSIDE',
        q: 'ana',
        page: 2,
      }),
    ).toEqual({ from: '2026-10-01', to: '2026-10-23', status: 'INSIDE', q: 'ana', page: '2' });
  });
});
