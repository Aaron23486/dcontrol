import { describe, expect, it } from 'vitest';
import { AUDIT_ACTIONS, AUDIT_ACTION_LABEL, auditListQuerySchema } from './audit';

describe('auditoría', () => {
  it('cada acción tiene su texto en español', () => {
    for (const action of AUDIT_ACTIONS) expect(AUDIT_ACTION_LABEL[action]).toBeTruthy();
  });

  it('la consulta acepta filtros válidos y aplica valores por defecto', () => {
    expect(
      auditListQuerySchema.parse({
        from: '2026-10-01',
        to: '2026-10-23',
        action: 'PERSON_UPDATED',
      }),
    ).toMatchObject({ page: 1, pageSize: 50, action: 'PERSON_UPDATED' });
  });

  it('rechaza una acción desconocida y un rango invertido', () => {
    expect(auditListQuerySchema.safeParse({ action: 'BORRAR_TODO' }).success).toBe(false);
    expect(auditListQuerySchema.safeParse({ from: '2026-10-23', to: '2026-10-01' }).success).toBe(
      false,
    );
  });
});
