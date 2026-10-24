import { PersonType, type PersonDetail } from '@cedi/shared';
import { describe, expect, it } from 'vitest';
import { changesBetween, formValuesOf } from './person-changes';

const person: PersonDetail = {
  id: 'p1',
  fullName: 'Juan Pérez',
  identification: '1234567',
  type: PersonType.CONTRACTOR,
  company: { id: 'c1', name: 'Acme' },
  isInside: false,
  lastVisit: null,
  createdAt: '2026-10-23T00:00:00.000Z',
  visits: [],
};

describe('changesBetween', () => {
  it('sin cambios devuelve un objeto vacío', () => {
    expect(changesBetween(person, formValuesOf(person))).toEqual({});
  });

  it('la misma cédula escrita con guiones o el nombre con espacios extra no cuentan como cambio', () => {
    expect(
      changesBetween(person, {
        ...formValuesOf(person),
        fullName: ' Juan   Pérez ',
        identification: '123-4567',
      }),
    ).toEqual({});
  });

  it('incluye solo los campos modificados', () => {
    expect(
      changesBetween(person, {
        ...formValuesOf(person),
        type: PersonType.VISITOR,
        companyId: 'c2',
      }),
    ).toEqual({ type: PersonType.VISITOR, companyId: 'c2' });
  });
});

describe('changesBetween: corrección de datos fijos (D13)', () => {
  it('incluye nombre y cédula cuando realmente cambian', () => {
    expect(
      changesBetween(person, {
        ...formValuesOf(person),
        fullName: 'Juan Pérez Gómez',
        identification: '765-4321',
      }),
    ).toEqual({ fullName: 'Juan Pérez Gómez', identification: '765-4321' });
  });
});
