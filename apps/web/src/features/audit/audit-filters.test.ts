import { AuditAction } from '@cedi/shared';
import { describe, expect, it } from 'vitest';
import { auditFiltersFromParams, auditParamsFromFilters } from './audit-filters';

const today = new Date(2026, 9, 23, 12, 0);

describe('filtros de auditoría en la URL', () => {
  it('por defecto muestra los últimos 7 días', () => {
    expect(auditFiltersFromParams(new URLSearchParams(), today)).toMatchObject({
      from: '2026-10-17',
      to: '2026-10-23',
      page: 1,
    });
  });

  it('ignora una acción desconocida', () => {
    expect(auditFiltersFromParams(new URLSearchParams('action=BORRAR'), today).action).toBe(
      undefined,
    );
  });

  it('conserva acción y registro al ida y vuelta', () => {
    const params = auditParamsFromFilters({
      action: AuditAction.PERSON_UPDATED,
      entityId: 'p1',
      page: 1,
    });
    expect(params).toEqual({ range: 'all', action: 'PERSON_UPDATED', entityId: 'p1' });
    expect(auditFiltersFromParams(new URLSearchParams(params), today)).toMatchObject({
      action: AuditAction.PERSON_UPDATED,
      entityId: 'p1',
      from: undefined,
    });
  });
});
