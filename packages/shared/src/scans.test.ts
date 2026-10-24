import { describe, expect, it } from 'vitest';
import { PersonType } from './enums';
import { closeVisitSchema, registerEntrySchema, scanSchema } from './scans';

const companyId = '0199f1a2-7c3d-7e4f-8a5b-6c7d8e9f0a1b';

describe('scanSchema', () => {
  it('normaliza la cédula y no confirma por defecto', () => {
    expect(scanSchema.parse({ identification: '001-123' })).toEqual({
      identification: '001123',
      confirmed: false,
    });
  });
});

describe('registerEntrySchema', () => {
  it('acepta una persona existente con sus datos de visita', () => {
    expect(
      registerEntrySchema.safeParse({
        personId: companyId,
        details: { personType: PersonType.EXTERNAL_WORKER },
      }).success,
    ).toBe(true);
  });

  it('acepta una persona nueva cuyo tipo coincide con la visita', () => {
    const result = registerEntrySchema.safeParse({
      newPerson: {
        fullName: 'Ana Gómez',
        identification: '7654321',
        type: PersonType.VISITOR,
        companyId,
      },
      details: { personType: PersonType.VISITOR, purpose: 'Reunión', area: 'Oficinas' },
    });
    expect(result.success).toBe(true);
  });

  it('rechaza una persona nueva cuyo tipo no coincide con los datos de la visita', () => {
    const result = registerEntrySchema.safeParse({
      newPerson: {
        fullName: 'Ana Gómez',
        identification: '7654321',
        type: PersonType.VISITOR,
        companyId,
      },
      details: { personType: PersonType.EXTERNAL_WORKER },
    });
    expect(result.success).toBe(false);
  });

  it('rechaza indicar persona existente y nueva a la vez', () => {
    expect(
      registerEntrySchema.safeParse({
        personId: companyId,
        newPerson: {},
        details: { personType: PersonType.EXTERNAL_WORKER },
      }).success,
    ).toBe(false);
  });
});

describe('closeVisitSchema', () => {
  it('exige fecha y hora ISO con zona horaria', () => {
    expect(closeVisitSchema.safeParse({ exitAt: '2026-10-22T18:00:00-06:00' }).success).toBe(true);
    expect(closeVisitSchema.safeParse({ exitAt: 'ayer' }).success).toBe(false);
  });
});
