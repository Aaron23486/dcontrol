import { z } from 'zod';
import type { Role } from './enums';

/** Límite superior para no hashear entradas arbitrariamente largas. */
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_MIN_LENGTH = 12;

export const emailSchema = z
  .string({ error: 'El correo es obligatorio.' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Ingresa un correo válido.').max(254, 'El correo es demasiado largo.'));

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: 'La contraseña es obligatoria.' })
    .min(1, 'La contraseña es obligatoria.')
    .max(PASSWORD_MAX_LENGTH, 'La contraseña es demasiado larga.'),
});
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Palabras base de las contraseñas más usadas (y las de este sistema). Se comparan con la
 * contraseña sin números ni símbolos, así «Password2024!» o «Cedi_123456» también cuentan.
 */
const COMMON_PASSWORD_WORDS = new Set([
  'password',
  'passw',
  'pass',
  'contrasena',
  'clave',
  'qwerty',
  'qwertyuiop',
  'asdfgh',
  'asdfghjkl',
  'zxcvbnm',
  'abc',
  'abcdef',
  'abcdefgh',
  'admin',
  'administrator',
  'administrador',
  'root',
  'user',
  'usuario',
  'welcome',
  'bienvenido',
  'letmein',
  'iloveyou',
  'teamo',
  'secret',
  'secreto',
  'test',
  'prueba',
  'demo',
  'changeme',
  'cambiaesta',
  'cedi',
  'cedicontrol',
  'dcontrol',
  'seguridad',
  'guarda',
  'monkey',
  'dragon',
  'football',
  'futbol',
  'master',
  'superman',
  'princess',
  'sunshine',
]);
const MIN_DISTINCT_CHARACTERS = 5;
const MIN_CONTEXT_WORD_LENGTH = 3;

/** Datos de la persona: su contraseña no debe contenerlos. */
export interface PasswordContext {
  email?: string;
  name?: string;
}

const lettersOnly = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const contextWords = ({ email, name }: PasswordContext): string[] =>
  [email?.split('@')[0], ...(name?.split(/\s+/) ?? [])]
    .map((word) => lettersOnly(word ?? ''))
    .filter((word) => word.length >= MIN_CONTEXT_WORD_LENGTH);

/**
 * SEC-08: motivo por el que una contraseña es fácil de adivinar, o `null` si no lo es.
 * Reglas locales (sin servicios externos): palabra o secuencia muy usada, pocos caracteres
 * distintos, solo números, o el nombre o el correo de la persona.
 */
export function guessablePasswordReason(
  password: string,
  context: PasswordContext = {},
): string | null {
  const letters = lettersOnly(password);
  if (letters.length === 0) return 'La contraseña no puede ser solo números o símbolos.';
  if (COMMON_PASSWORD_WORDS.has(letters)) return 'Esa contraseña es muy común. Elige otra.';
  if (new Set(password.toLowerCase()).size < MIN_DISTINCT_CHARACTERS) {
    return 'La contraseña repite demasiado los mismos caracteres.';
  }
  if (contextWords(context).some((word) => letters.includes(word))) {
    return 'La contraseña no debe contener tu nombre ni tu correo.';
  }
  return null;
}

/** Contraseña nueva de un usuario (create-admin y `npm run users`). */
export const newPasswordSchema = (context: PasswordContext = {}) =>
  z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    )
    .max(PASSWORD_MAX_LENGTH, 'La contraseña es demasiado larga.')
    .superRefine((password, ctx) => {
      const reason = guessablePasswordReason(password, context);
      if (reason) ctx.addIssue({ code: 'custom', message: reason });
    });

export const userNameSchema = z
  .string()
  .trim()
  .min(2, 'El nombre es demasiado corto.')
  .max(120, 'El nombre es demasiado largo.');

/** Usuario autenticado tal como lo expone `GET /auth/me`. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
