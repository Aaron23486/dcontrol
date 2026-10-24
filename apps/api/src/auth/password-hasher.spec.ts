import { describe, expect, it } from 'vitest';
import { PasswordHasher } from './password-hasher';

describe('PasswordHasher', () => {
  const hasher = new PasswordHasher();

  it('genera un hash argon2id que no contiene la contraseña', async () => {
    const hash = await hasher.hash('contraseña-secreta-123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(hash).not.toContain('contraseña-secreta-123');
  });

  it('genera hashes distintos para la misma contraseña (salt)', async () => {
    const [a, b] = await Promise.all([
      hasher.hash('igual-igual-igual'),
      hasher.hash('igual-igual-igual'),
    ]);
    expect(a).not.toBe(b);
  });

  it('verifica la contraseña correcta y rechaza la incorrecta', async () => {
    const hash = await hasher.hash('correcta-123456');
    expect(await hasher.verify(hash, 'correcta-123456')).toBe(true);
    expect(await hasher.verify(hash, 'incorrecta-12345')).toBe(false);
  });

  it('devuelve false ante un hash malformado en lugar de fallar', async () => {
    expect(await hasher.verify('no-es-un-hash', 'x')).toBe(false);
  });
});
