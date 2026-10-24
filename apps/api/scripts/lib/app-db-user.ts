import type { PrismaService } from '../../src/prisma/prisma.service';

/** Rol sin inicio de sesión con los permisos de la API (migración `rol_de_aplicacion`). */
export const APP_DB_ROLE = 'cedi_app';

const ROLE_NAME = /^[a-z_][a-z0-9_]{0,62}$/;
const MIN_PASSWORD_LENGTH = 16;

/** Usuario y contraseña de una URL de PostgreSQL, ya decodificados. */
export function credentialsOf(databaseUrl: string): { user: string; password: string } {
  const url = new URL(databaseUrl);
  return { user: decodeURIComponent(url.username), password: decodeURIComponent(url.password) };
}

/** Ejecuta una sentencia armada con `format()` de PostgreSQL, que cita nombres y valores. */
async function runFormatted(db: PrismaService, template: string, ...args: string[]): Promise<void> {
  const placeholders = args.map((_, index) => `$${index + 2}::text`).join(', ');
  const [row] = await db.$queryRawUnsafe<{ sql: string }[]>(
    `SELECT format($1::text, ${placeholders}) AS sql`,
    template,
    ...args,
  );
  if (!row) throw new Error('No se pudo preparar la sentencia.');
  await db.$executeRawUnsafe(row.sql);
}

/**
 * SEC-02 (ADR 0012): crea o actualiza el usuario con que opera la API (el de `runtimeUrl`):
 * con inicio de sesión, sin privilegios de administración y miembro de `cedi_app`.
 * `owner` es la conexión del dueño de las tablas (la de las migraciones).
 */
export async function ensureAppDbUser(owner: PrismaService, runtimeUrl: string): Promise<string> {
  const { user, password } = credentialsOf(runtimeUrl);
  if (!ROLE_NAME.test(user)) {
    throw new Error('El usuario de la API solo puede tener minúsculas, números y guion bajo.');
  }
  if (user === APP_DB_ROLE) {
    throw new Error(
      `El usuario de la API no puede llamarse ${APP_DB_ROLE}: ese es el rol de permisos.`,
    );
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `La contraseña del usuario de la API debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }
  const [state] = await owner.$queryRaw<{ owner: string; exists: boolean; privileged: boolean }[]>`
    SELECT current_user AS owner,
           EXISTS (SELECT FROM pg_roles WHERE rolname = ${user}) AS exists,
           EXISTS (SELECT FROM pg_roles WHERE rolname = ${user} AND (rolsuper OR rolcreaterole))
             AS privileged`;
  if (!state || state.owner === user || state.privileged) {
    throw new Error(
      'DATABASE_URL debe usar un usuario propio de la API, distinto del dueño de las tablas y sin privilegios de administración.',
    );
  }
  const attributes = 'LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS';
  await runFormatted(
    owner,
    `${state.exists ? 'ALTER' : 'CREATE'} ROLE %I WITH ${attributes} PASSWORD %L`,
    user,
    password,
  );
  await runFormatted(owner, `GRANT ${APP_DB_ROLE} TO %I`, user);
  return user;
}

/** Impide que el usuario vuelva a iniciar sesión (p. ej. el de las pruebas e2e al terminar). */
export async function disableAppDbUser(owner: PrismaService, runtimeUrl: string): Promise<void> {
  const { user } = credentialsOf(runtimeUrl);
  const [state] = await owner.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (SELECT FROM pg_roles WHERE rolname = ${user}) AS exists`;
  if (state?.exists) await runFormatted(owner, 'ALTER ROLE %I WITH NOLOGIN', user);
}
