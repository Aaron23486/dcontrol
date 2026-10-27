/**
 * Datos de demostración para desarrollo. Idempotente y sin datos sensibles:
 * los usuarios se crean con `npm run create-admin`, nunca aquí (D14).
 * Para cuentas y visitas de demostración: `npm run demo:setup` (ADR 0016).
 *
 *   npm run db:seed
 */
import { DEMO_COMPANIES, ensureDemoCompanies } from '../scripts/lib/demo-companies';
import { databaseUrlSchema } from '../src/config/app-config';
import { loadEnvFile } from '../src/config/load-env-file';
import { PrismaService } from '../src/prisma/prisma.service';

async function main(): Promise<void> {
  loadEnvFile();
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed de demostración no se ejecuta en producción.');
  }
  const prisma = new PrismaService({
    databaseUrl: databaseUrlSchema.parse(process.env.DATABASE_URL),
  });
  try {
    await ensureDemoCompanies(prisma);
    console.log(`Seed completado: ${DEMO_COMPANIES.length} empresas de demostración.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
