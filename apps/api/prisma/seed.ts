/**
 * Datos de demostración para desarrollo. Idempotente y sin datos sensibles:
 * los usuarios se crean con `npm run create-admin`, nunca aquí (D14).
 *
 *   npm run db:seed
 */
import { normalizeCompanyName } from '@cedi/shared';
import { databaseUrlSchema } from '../src/config/app-config';
import { loadEnvFile } from '../src/config/load-env-file';
import { PrismaService } from '../src/prisma/prisma.service';

const DEMO_COMPANIES = [
  'Transportes del Norte S.A.',
  'Servicios Industriales Rivera',
  'Mantenimiento Integral MX',
  'Limpieza Total',
  // Para visitantes que no vienen en nombre de una empresa (la empresa es obligatoria, D9).
  'Particular',
];

async function main(): Promise<void> {
  loadEnvFile();
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed de demostración no se ejecuta en producción.');
  }
  const prisma = new PrismaService({
    databaseUrl: databaseUrlSchema.parse(process.env.DATABASE_URL),
  });
  try {
    for (const name of DEMO_COMPANIES) {
      const nameNormalized = normalizeCompanyName(name);
      await prisma.company.upsert({
        where: { nameNormalized },
        update: {},
        create: { name, nameNormalized },
      });
    }
    console.log(`Seed completado: ${DEMO_COMPANIES.length} empresas de demostración.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
