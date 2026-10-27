import { newPasswordSchema, type PasswordContext } from '@cedi/shared';
import { randomInt } from 'node:crypto';

// Sin caracteres que se confunden al copiarlos a mano (0/O, 1/l/I).
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const GROUPS = 4;
const GROUP_LENGTH = 4;

/**
 * Contraseña aleatoria para una cuenta de demostración, p. ej. «k7Rm-x2Qa-Hp9d-Wn4e»
 * (16 caracteres al azar, unos 93 bits). Siempre cumple la regla de contraseñas nuevas.
 */
export function generateDemoPassword(context: PasswordContext = {}): string {
  const schema = newPasswordSchema(context);
  for (;;) {
    const password = Array.from({ length: GROUPS }, () =>
      Array.from({ length: GROUP_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join(''),
    ).join('-');
    if (schema.safeParse(password).success) return password;
  }
}
