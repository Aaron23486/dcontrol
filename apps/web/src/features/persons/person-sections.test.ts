import { PERSON_TYPES, PersonType } from '@cedi/shared';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SECTION,
  PERSON_SECTIONS,
  sectionBySlug,
  sectionByType,
  visitColumnsFor,
} from './person-sections';

describe('secciones por tipo (spec §15)', () => {
  it('hay una sección por cada tipo de persona', () => {
    expect(PERSON_SECTIONS.map((section) => section.type).sort()).toEqual([...PERSON_TYPES].sort());
  });

  it('se encuentran por su dirección y por su tipo', () => {
    expect(sectionBySlug('contratistas')?.type).toBe(PersonType.CONTRACTOR);
    expect(sectionBySlug('no-existe')).toBeUndefined();
    expect(sectionByType(PersonType.VISITOR).slug).toBe('visitantes');
    expect(DEFAULT_SECTION.type).toBe(PersonType.EXTERNAL_WORKER);
  });

  it('cada tipo muestra solo sus columnas (spec §7)', () => {
    expect(visitColumnsFor(PersonType.EXTERNAL_WORKER)).toEqual({
      purpose: false,
      area: false,
      tools: false,
    });
    expect(visitColumnsFor(PersonType.VISITOR)).toEqual({
      purpose: true,
      area: true,
      tools: false,
    });
    expect(visitColumnsFor(PersonType.MAINTENANCE_TECHNICIAN).tools).toBe(true);
  });
});
