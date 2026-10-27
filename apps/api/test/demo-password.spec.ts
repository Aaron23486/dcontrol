import { newPasswordSchema } from '@cedi/shared';
import { describe, expect, it } from 'vitest';
import { generateDemoPassword } from '../scripts/lib/demo-password';

describe('generateDemoPassword (npm run demo:setup, ADR 0016)', () => {
  const account = { name: 'Guarda de demostración', email: 'seguridad@demo.cedi.test' };
  const passwords = Array.from({ length: 200 }, () => generateDemoPassword(account));

  it('siempre cumple la regla de contraseñas nuevas, con el nombre y el correo de la cuenta', () => {
    for (const password of passwords) {
      expect(newPasswordSchema(account).safeParse(password).success).toBe(true);
    }
  });

  it('tiene cuatro grupos de cuatro caracteres sin caracteres ambiguos', () => {
    for (const password of passwords) {
      expect(password).toMatch(/^[a-kmnp-zA-HJ-NP-Z2-9]{4}(-[a-kmnp-zA-HJ-NP-Z2-9]{4}){3}$/);
    }
  });

  it('no repite contraseñas', () => {
    expect(new Set(passwords).size).toBe(passwords.length);
  });
});
