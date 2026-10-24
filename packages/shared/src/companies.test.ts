import { describe, expect, it } from 'vitest';
import { normalizeCompanyName } from './companies';

describe('normalizeCompanyName', () => {
  it('unifica variantes del mismo nombre', () => {
    expect(normalizeCompanyName(' Acme  S.A. de C.V.')).toBe('ACME SA DE CV');
    expect(normalizeCompanyName('ACME SA DE CV')).toBe('ACME SA DE CV');
  });

  it('quita acentos y diacríticos (ñ se vuelve N)', () => {
    expect(normalizeCompanyName('Logística Peña')).toBe('LOGISTICA PENA');
  });

  it('conserva & y guiones', () => {
    expect(normalizeCompanyName('Smith & Co - Norte')).toBe('SMITH & CO - NORTE');
  });
});
