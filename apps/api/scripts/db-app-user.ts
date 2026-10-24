/**
 * SEC-02 (ADR 0012): crea o actualiza el usuario de base de datos con que opera la API.
 * Se ejecuta con las migraciones:
 *
 *   npm run db:deploy        (prisma migrate deploy + este script)
 *
 * MIGRATION_DATABASE_URL: el dueño de las tablas (aplica migraciones y crea el usuario).
 * DATABASE_URL: el usuario de la API; se toma de ahí su nombre y su contraseña.
 */
import { z } from 'zod';
import { databaseUrlSchema } from '../src/config/app-config';
import { loadEnvFile } from '../src/config/load-env-file';
import { PrismaService } from '../src/prisma/prisma.service';
import { APP_DB_ROLE, ensureAppDbUser } from './lib/app-db-user';

async function main(): Promise<void> {
  loadEnvFile();
  const ownerUrl = z
    .string({ error: 'Define MIGRATION_DATABASE_URL (el dueño de las tablas) en .env.' })
    .pipe(databaseUrlSchema)
    .parse(process.env.MIGRATION_DATABASE_URL);
  const runtimeUrl = databaseUrlSchema.parse(process.env.DATABASE_URL);
  const owner = new PrismaService({ databaseUrl: ownerUrl });
  try {
    const user = await ensureAppDbUser(owner, runtimeUrl);
    console.log(`Usuario de la API listo: ${user} (rol ${APP_DB_ROLE}, sin privilegios).`);
  } finally {
    await owner.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof z.ZodError
      ? (error.issues[0]?.message ?? 'Configuración inválida.')
      : error instanceof Error
        ? error.message
        : String(error);
  console.error(message);
  process.exit(1);
});
