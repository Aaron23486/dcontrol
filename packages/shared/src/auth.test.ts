import { describe, expect, it } from 'vitest';
import { PASSWORD_MAX_LENGTH, loginSchema, newPasswordSchema } from './auth';

describe('loginSchema', () => {
  it('normaliza el correo a minúsculas y sin espacios', () => {
    const result = loginSchema.parse({ email: '  Admin@CEDI.local ', password: 'x' });
    expect(result.email).toBe('admin@cedi.local');
  });

  it('rechaza un correo inválido', () => {
    expect(loginSchema.safeParse({ email: 'no-es-correo', password: 'x' }).success).toBe(false);
  });

  it('rechaza contraseña vacía', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
  });

  it('rechaza contraseñas más largas que el límite', () => {
    const password = 'a'.repeat(PASSWORD_MAX_LENGTH + 1);
    expect(loginSchema.safeParse({ email: 'a@b.co', password }).success).toBe(false);
  });
});

describe('newPasswordSchema', () => {
  it('exige longitud mínima', () => {
    expect(newPasswordSchema.safeParse('corta').success).toBe(false);
    expect(newPasswordSchema.safeParse('una-contraseña-larga').success).toBe(true);
  });
});
