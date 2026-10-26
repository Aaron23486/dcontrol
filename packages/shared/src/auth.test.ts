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
  const firstError = (password: string, context = {}) =>
    newPasswordSchema(context).safeParse(password).error?.issues[0]?.message;

  it('exige longitud mínima', () => {
    expect(newPasswordSchema().safeParse('corta').success).toBe(false);
    expect(newPasswordSchema().safeParse('una-contraseña-larga').success).toBe(true);
  });

  it.each(['Password2024!', 'contraseña123', 'Qwertyuiop12', 'Cedi_12345678', 'admin@123456'])(
    'SEC-08: rechaza la contraseña común %s aunque lleve números o símbolos',
    (password) => {
      expect(firstError(password)).toBe('Esa contraseña es muy común. Elige otra.');
    },
  );

  it('SEC-08: rechaza contraseñas de solo números o con pocos caracteres distintos', () => {
    expect(firstError('123456789012')).toBe('La contraseña no puede ser solo números o símbolos.');
    expect(firstError('abababababab')).toBe(
      'La contraseña repite demasiado los mismos caracteres.',
    );
  });

  it('SEC-08: rechaza contraseñas con el nombre o el correo de la persona', () => {
    const context = { email: 'sergio.rivera@cedi.test', name: 'Sergio Rivera' };
    expect(firstError('Rivera-de-noche-77', context)).toBe(
      'La contraseña no debe contener tu nombre ni tu correo.',
    );
    expect(firstError('noche-de-luna-77', context)).toBeUndefined();
  });

  it('acepta una frase larga y poco común', () => {
    expect(firstError('caballo-correcto-bateria-grapa')).toBeUndefined();
  });
});
