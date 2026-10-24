import { describe, expect, it } from 'vitest';
import { PersonType, Role } from './enums';
import { canCorrectPersonIdentity, personListQuerySchema, updatePersonSchema } from './persons';
import { normalizeSearchText } from './text';

describe('updatePersonSchema', () => {
  it('acepta un solo campo modificado', () => {
    expect(updatePersonSchema.parse({ type: PersonType.CONTRACTOR })).toEqual({
      type: PersonType.CONTRACTOR,
    });
  });

  it('rechaza una edición vacía', () => {
    expect(updatePersonSchema.safeParse({}).error?.issues[0]?.message).toBe(
      'No hay cambios para guardar.',
    );
  });

  it('normaliza la cédula corregida', () => {
    expect(updatePersonSchema.parse({ identification: '1-234-567' })).toEqual({
      identification: '1234567',
    });
  });
});

describe('canCorrectPersonIdentity (D13)', () => {
  it('solo el administrador corrige nombre y cédula', () => {
    expect(canCorrectPersonIdentity(Role.ADMIN)).toBe(true);
    expect(canCorrectPersonIdentity(Role.SECURITY)).toBe(false);
  });
});

describe('personListQuerySchema', () => {
  it('aplica página y tamaño por defecto y convierte números de la URL', () => {
    expect(personListQuerySchema.parse({ type: PersonType.VISITOR, page: '2' })).toEqual({
      type: PersonType.VISITOR,
      page: 2,
      pageSize: 20,
    });
  });

  it('exige el tipo (cada sección es de un tipo)', () => {
    expect(personListQuerySchema.safeParse({}).success).toBe(false);
  });
});

describe('normalizeSearchText', () => {
  it('permite encontrar "Pérez" escribiendo "perez"', () => {
    expect(normalizeSearchText('José Pérez')).toBe(normalizeSearchText('jose perez'));
  });
});
