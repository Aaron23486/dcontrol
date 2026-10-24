import { describe, expect, it } from 'vitest';
import { PERSON_TYPES, PersonType } from './enums';
import { VISIT_FIELDS_BY_TYPE, visitDetailsSchema, visitListQuerySchema } from './visits';

const fail = (input: unknown) => {
  const result = visitDetailsSchema.safeParse(input);
  expect(result.success).toBe(false);
  return result.error?.issues[0]?.message;
};

describe('visitDetailsSchema: campos por tipo (spec §7)', () => {
  it('trabajador externo: no pide nada adicional', () => {
    expect(visitDetailsSchema.parse({ personType: PersonType.EXTERNAL_WORKER })).toEqual({
      personType: PersonType.EXTERNAL_WORKER,
    });
  });

  it('trabajador externo: rechaza motivo o área (no corresponden)', () => {
    fail({ personType: PersonType.EXTERNAL_WORKER, purpose: 'x', area: 'y' });
  });

  it.each([PersonType.CONTRACTOR, PersonType.VISITOR, PersonType.MAINTENANCE_TECHNICIAN])(
    '%s: exige motivo y área',
    (personType) => {
      expect(fail({ personType, area: 'Bodega' })).toBe('El motivo es obligatorio.');
      expect(fail({ personType, purpose: 'Reparación', area: '   ' })).toBe(
        'El área es obligatoria.',
      );
    },
  );

  it('contratista: acepta motivo y área y recorta espacios', () => {
    expect(
      visitDetailsSchema.parse({
        personType: PersonType.CONTRACTOR,
        purpose: '  Pintura  ',
        area: ' Andén 3 ',
      }),
    ).toEqual({ personType: PersonType.CONTRACTOR, purpose: 'Pintura', area: 'Andén 3' });
  });

  it('técnico: las herramientas son opcionales', () => {
    const parsed = visitDetailsSchema.parse({
      personType: PersonType.MAINTENANCE_TECHNICIAN,
      purpose: 'Mantenimiento',
      area: 'Cuarto eléctrico',
    });
    expect(parsed).toMatchObject({ tools: [] });
  });

  it('técnico: valida cada herramienta', () => {
    expect(
      fail({
        personType: PersonType.MAINTENANCE_TECHNICIAN,
        purpose: 'Mantenimiento',
        area: 'Cuarto eléctrico',
        tools: [{ name: 'Taladro', quantity: 0 }],
      }),
    ).toBe('La cantidad debe ser mayor que cero.');
  });

  it('R19: visitante y contratista no admiten herramientas', () => {
    for (const personType of [PersonType.VISITOR, PersonType.CONTRACTOR]) {
      fail({ personType, purpose: 'x', area: 'y', tools: [{ name: 'Taladro' }] });
    }
  });
});

describe('VISIT_FIELDS_BY_TYPE', () => {
  it('define los campos de los cuatro tipos', () => {
    expect(Object.keys(VISIT_FIELDS_BY_TYPE).sort()).toEqual([...PERSON_TYPES].sort());
  });

  it('solo el técnico tiene herramientas', () => {
    const withTools = PERSON_TYPES.filter((type) =>
      (VISIT_FIELDS_BY_TYPE[type] as readonly string[]).includes('tools'),
    );
    expect(withTools).toEqual([PersonType.MAINTENANCE_TECHNICIAN]);
  });
});

describe('visitListQuerySchema', () => {
  it('acepta un rango de días y aplica página por defecto', () => {
    expect(
      visitListQuerySchema.parse({
        type: PersonType.VISITOR,
        from: '2026-10-01',
        to: '2026-10-23',
        status: 'EXITED',
      }),
    ).toMatchObject({ from: '2026-10-01', to: '2026-10-23', page: 1, pageSize: 25 });
  });

  it('rechaza un rango invertido', () => {
    const result = visitListQuerySchema.safeParse({
      type: PersonType.VISITOR,
      from: '2026-10-23',
      to: '2026-10-01',
    });
    expect(result.error?.issues[0]?.message).toBe(
      'La fecha inicial no puede ser posterior a la final.',
    );
  });

  it('rechaza fechas con formato inválido', () => {
    expect(
      visitListQuerySchema.safeParse({ type: PersonType.VISITOR, from: '23/10/2026' }).success,
    ).toBe(false);
  });
});
