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

/** Contraseña para usuarios nuevos (create-admin y, más adelante, gestión de usuarios). */
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .max(PASSWORD_MAX_LENGTH, 'La contraseña es demasiado larga.');

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
