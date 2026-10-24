import { describe, expect, it } from 'vitest';
import { PersonType } from './enums';
import { identificationSchema, normalizeIdentification, personSchema } from './persons';

describe('personSchema', () => {
  const valid = {
    fullName: '  Juan Pérez ',
    identification: '001-1234567-8',
    type: PersonType.VISITOR,
    companyId: '0199f1a2-7c3d-7e4f-8a5b-6c7d8e9f0a1b',
  };

  it('normaliza nombre y cédula', () => {
    expect(personSchema.parse(valid)).toMatchObject({
      fullName: 'Juan Pérez',
      identification: '00112345678',
    });
  });

  it('junta espacios repetidos sin alterar las letras', () => {
    expect(personSchema.parse({ ...valid, fullName: 'Luis   Sosa  Ruiz' }).fullName).toBe(
      'Luis Sosa Ruiz',
    );
  });

  it('exige empresa también para visitantes (D9)', () => {
    const result = personSchema.safeParse({ ...valid, companyId: undefined });
    expect(result.error?.issues[0]?.message).toBe('Selecciona la empresa.');
  });

  it('rechaza un tipo desconocido', () => {
    expect(personSchema.safeParse({ ...valid, type: 'PROVEEDOR' }).success).toBe(false);
  });
});

describe('normalizeIdentification', () => {
  it('unifica las distintas formas de escribir la misma cédula', () => {
    expect(normalizeIdentification('1-234-567')).toBe('1234567');
    expect(normalizeIdentification('1.234.567')).toBe('1234567');
    expect(normalizeIdentification(' 1 234 567 ')).toBe('1234567');
  });

  it('pasa las letras a mayúsculas (documentos extranjeros)', () => {
    expect(normalizeIdentification('ab-12345')).toBe('AB12345');
  });
});

describe('identificationSchema', () => {
  it('devuelve la cédula normalizada', () => {
    expect(identificationSchema.parse('001-1234567-8')).toBe('00112345678');
  });

  it('rechaza una cédula vacía', () => {
    const result = identificationSchema.safeParse('  - ');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('La cédula es obligatoria.');
  });

  it('rechaza caracteres no permitidos', () => {
    const result = identificationSchema.safeParse('1234/567');
    expect(result.error?.issues[0]?.message).toBe(
      'La cédula solo puede tener números, letras y guiones.',
    );
  });

  it('rechaza cédulas demasiado cortas o largas', () => {
    expect(identificationSchema.safeParse('123').success).toBe(false);
    expect(identificationSchema.safeParse('1'.repeat(21)).success).toBe(false);
    expect(identificationSchema.safeParse('1234').success).toBe(true);
  });
});
