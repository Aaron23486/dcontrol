import { PersonType, type InsideVisit } from '@cedi/shared';
import { describe, expect, it } from 'vitest';
import { countByType, filterInside } from './inside-filter';

const visit = (fullName: string, identification: string, personType: PersonType): InsideVisit => ({
  visitId: identification,
  person: { id: identification, fullName, identification },
  personType,
  company: { id: 'c1', name: 'Acme' },
  entryAt: '2026-10-23T15:00:00.000Z',
  purpose: null,
  area: null,
  isFromPreviousDay: false,
});

const visits = [
  visit('José Pérez', '1234567', PersonType.CONTRACTOR),
  visit('Ana Gómez', '7654321', PersonType.VISITOR),
  visit('Luis Díaz', '1299999', PersonType.CONTRACTOR),
];

describe('filterInside', () => {
  it('filtra por tipo', () => {
    expect(filterInside(visits, PersonType.VISITOR, '').map((v) => v.person.fullName)).toEqual([
      'Ana Gómez',
    ]);
  });

  it('busca por nombre sin tildes', () => {
    expect(filterInside(visits, 'ALL', 'perez').map((v) => v.person.fullName)).toEqual([
      'José Pérez',
    ]);
  });

  it('busca por inicio de cédula escrita con guiones', () => {
    expect(filterInside(visits, 'ALL', '12-').map((v) => v.person.fullName)).toEqual([
      'José Pérez',
      'Luis Díaz',
    ]);
  });
});

describe('countByType', () => {
  it('cuenta el total y por tipo', () => {
    expect(countByType(visits)).toMatchObject({ ALL: 3, CONTRACTOR: 2, VISITOR: 1 });
  });
});
