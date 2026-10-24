import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { APP_DB_ROLE, disableAppDbUser, ensureAppDbUser } from '../../scripts/lib/app-db-user';
import { clearDatabase, createTestPrisma, testDatabaseUrl } from './test-database';

const prisma = createTestPrisma();

/** Ejecuta una sentencia con los permisos de la API (rol `cedi_app`) y sin dejar cambios. */
async function asApp(sql: string): Promise<void> {
  await prisma
    .$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE ${APP_DB_ROLE}`);
      await tx.$executeRawUnsafe(sql);
      // Se deshace al final: la prueba solo verifica el permiso, no deja datos.
      throw new Rollback();
    })
    .catch((error: unknown) => {
      if (!(error instanceof Rollback)) throw error;
    });
}

class Rollback extends Error {}

describe('SEC-02: la API opera sin privilegios de administración (ADR 0012)', () => {
  beforeAll(() => clearDatabase(prisma));
  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  it('el rol no es superusuario ni puede crear roles, bases o iniciar sesión', async () => {
    const [role] = await prisma.$queryRaw<
      { rolsuper: boolean; rolcreaterole: boolean; rolcreatedb: boolean; rolcanlogin: boolean }[]
    >`SELECT rolsuper, rolcreaterole, rolcreatedb, rolcanlogin FROM pg_roles WHERE rolname = ${APP_DB_ROLE}`;
    expect(role).toEqual({
      rolsuper: false,
      rolcreaterole: false,
      rolcreatedb: false,
      rolcanlogin: false,
    });
  });

  it.each([
    'SELECT count(*) FROM users',
    'SELECT count(*) FROM audit_logs',
    `INSERT INTO companies (id, name, name_normalized) VALUES (gen_random_uuid(), 'Prueba', 'PRUEBA')`,
    `UPDATE visits SET exit_at = now(), exit_by = entry_by WHERE false`,
    `UPDATE persons SET full_name = full_name, updated_at = now() WHERE false`,
    `UPDATE users SET sessions_valid_from = now(), updated_at = now() WHERE false`,
  ])('permite lo que la operación necesita: %s', async (sql) => {
    await expect(asApp(sql)).resolves.toBeUndefined();
  });

  it.each([
    // La auditoría y el historial no se pueden alterar ni borrar.
    `UPDATE audit_logs SET action = 'X' WHERE false`,
    'DELETE FROM audit_logs',
    'DELETE FROM visits',
    'UPDATE visits SET entry_at = now() WHERE false',
    'UPDATE visits SET person_type = person_type WHERE false',
    'UPDATE companies SET name = name WHERE false',
    'UPDATE users SET role = role WHERE false',
    'TRUNCATE persons',
    // Ni cambiar el esquema, crear roles o ejecutar comandos del sistema.
    'DROP TABLE visit_tools',
    'ALTER TABLE persons ADD COLUMN intruso int',
    'CREATE TABLE intrusa (id int)',
    'CREATE ROLE intruso',
    `COPY (SELECT 1) TO PROGRAM 'echo intruso'`,
    'SELECT count(*) FROM _prisma_migrations',
  ])('rechaza: %s', async (sql) => {
    await expect(asApp(sql)).rejects.toThrow(/permission denied|must be|not allowed/i);
  });

  describe('usuario de la API (npm run db:deploy)', () => {
    const USER = 'cedi_it_app';
    const urlFor = (user: string, password: string) => {
      const url = new URL(testDatabaseUrl);
      url.username = user;
      url.password = encodeURIComponent(password);
      return url.toString();
    };

    afterAll(async () => {
      await prisma.$executeRawUnsafe(`DROP ROLE IF EXISTS ${USER}`);
    });

    it('lo crea sin privilegios, miembro de cedi_app, y puede operar', async () => {
      const url = urlFor(USER, 'contraseña-de-la-api-1');
      expect(await ensureAppDbUser(prisma, url)).toBe(USER);
      // Repetirlo (p. ej. al cambiar la contraseña) actualiza el mismo usuario.
      await ensureAppDbUser(prisma, url);
      const [role] = await prisma.$queryRaw<
        { rolsuper: boolean; rolcanlogin: boolean; member: boolean }[]
      >`
        SELECT rolsuper, rolcanlogin, pg_has_role(rolname, ${APP_DB_ROLE}, 'MEMBER') AS member
        FROM pg_roles WHERE rolname = ${USER}`;
      expect(role).toEqual({ rolsuper: false, rolcanlogin: true, member: true });

      const app = new PrismaService({ databaseUrl: url });
      try {
        await expect(app.user.count()).resolves.toBe(0);
        await expect(app.$executeRawUnsafe('DELETE FROM audit_logs')).rejects.toThrow(
          /permission denied/i,
        );
      } finally {
        await app.$disconnect();
      }
    });

    it('al desactivarlo ya no puede iniciar sesión', async () => {
      const url = urlFor(USER, 'contraseña-de-la-api-1');
      await ensureAppDbUser(prisma, url);
      await disableAppDbUser(prisma, url);
      const [role] = await prisma.$queryRaw<{ rolcanlogin: boolean }[]>`
        SELECT rolcanlogin FROM pg_roles WHERE rolname = ${USER}`;
      expect(role?.rolcanlogin).toBe(false);
    });

    it('rechaza usar al dueño de las tablas o una contraseña corta', async () => {
      await expect(ensureAppDbUser(prisma, testDatabaseUrl)).rejects.toThrow(
        /distinto del dueño|al menos 16/,
      );
      await expect(ensureAppDbUser(prisma, urlFor(USER, 'corta'))).rejects.toThrow(/al menos 16/);
      await expect(
        ensureAppDbUser(prisma, urlFor(APP_DB_ROLE, 'contraseña-de-la-api-1')),
      ).rejects.toThrow(/rol de permisos/);
    });
  });
});
