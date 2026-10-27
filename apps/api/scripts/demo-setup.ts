/**
 * Cuentas y datos de demostración para probar la app en local (ADR 0016).
 *
 *   npm run demo:setup
 *
 * Crea (o renueva) una cuenta por rol en @demo.cedi.test con una contraseña generada que se
 * muestra solo esta vez, y personas y visitas ficticias. Se niega en producción.
 */
import { databaseUrlSchema } from '../src/config/app-config';
import { loadEnvFile } from '../src/config/load-env-file';
import { PrismaService } from '../src/prisma/prisma.service';
import { setupDemo } from './lib/demo-data';

const ROLE_LABEL = { SECURITY: 'Seguridad', ADMIN: 'Administrador' } as const;

async function main(): Promise<void> {
  loadEnvFile();
  const prisma = new PrismaService({
    databaseUrl: databaseUrlSchema.parse(process.env.DATABASE_URL),
  });
  try {
    const result = await setupDemo(prisma, {
      now: new Date(),
      timezone: process.env.CEDI_TIMEZONE ?? 'America/Mexico_City',
      nodeEnv: process.env.NODE_ENV,
    });
    console.log('\nCuentas de demostración (las contraseñas se muestran solo esta vez):\n');
    for (const account of result.accounts) {
      console.log(
        `  ${ROLE_LABEL[account.role].padEnd(14)} ${account.email.padEnd(26)} ${account.password}`,
      );
    }
    console.log(
      result.dataCreated
        ? `\nDatos de demostración: ${result.persons} personas y ${result.visits} visitas.`
        : '\nLos datos de demostración ya existían; no se duplicaron.',
    );
    console.log(
      'Inicia la app con `npm run dev` y entra en http://localhost:5173.\n' +
        'Si pierdes las contraseñas, vuelve a ejecutar `npm run demo:setup` para generar otras.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
