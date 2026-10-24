import { PersonType, visitDetailsSchema } from '@cedi/shared';
import { describe, expect, it } from 'vitest';
import { toVisitDetailsInput } from './visit-details-input';

const values = {
  purpose: 'Reparación',
  area: 'Bodega',
  tools: [
    { name: 'Taladro', description: '', quantity: '2' },
    { name: '  ', description: 'fila vacía', quantity: '' },
  ],
};

describe('toVisitDetailsInput', () => {
  it('trabajador externo: no envía motivo, área ni herramientas', () => {
    expect(toVisitDetailsInput(PersonType.EXTERNAL_WORKER, values)).toEqual({
      personType: PersonType.EXTERNAL_WORKER,
    });
  });

  it('visitante: motivo y área, sin herramientas', () => {
    const input = toVisitDetailsInput(PersonType.VISITOR, values);
    expect(input).toEqual({
      personType: PersonType.VISITOR,
      purpose: 'Reparación',
      area: 'Bodega',
    });
    expect(visitDetailsSchema.safeParse(input).success).toBe(true);
  });

  it('técnico: incluye las herramientas con nombre e ignora filas vacías', () => {
    expect(toVisitDetailsInput(PersonType.MAINTENANCE_TECHNICIAN, values)).toEqual({
      personType: PersonType.MAINTENANCE_TECHNICIAN,
      purpose: 'Reparación',
      area: 'Bodega',
      tools: [{ name: 'Taladro', quantity: 2 }],
    });
  });
});
