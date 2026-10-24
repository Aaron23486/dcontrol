import { PERSON_TYPES, ROLES } from '@cedi/shared';
import { describe, expect, it } from 'vitest';
import { PersonType, Role } from '../generated/prisma/enums';

// Los enums existen en Prisma (BD) y en @cedi/shared (API y web). Esta prueba evita que diverjan.
describe('paridad de enums entre Prisma y @cedi/shared', () => {
  it('Role', () => {
    expect(Object.values(Role).sort()).toEqual([...ROLES].sort());
  });

  it('PersonType', () => {
    expect(Object.values(PersonType).sort()).toEqual([...PERSON_TYPES].sort());
  });
});
