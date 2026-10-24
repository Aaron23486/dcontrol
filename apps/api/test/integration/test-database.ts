import { loadEnvFile } from '../../src/config/load-env-file';
import { PrismaService } from '../../src/prisma/prisma.service';

loadEnvFile();

/** URL de la base de pruebas; global-setup ya verificó que existe y que no es la de desarrollo. */
export const testDatabaseUrl = process.env.DATABASE_URL_TEST ?? '';

export const createTestPrisma = () => new PrismaService({ databaseUrl: testDatabaseUrl });

/** Vacía todas las tablas. Se usa antes de cada prueba y al terminar, para no dejar datos sobrantes. */
export const clearDatabase = (prisma: PrismaService) =>
  prisma.$executeRawUnsafe(
    'TRUNCATE visit_tools, visits, audit_logs, persons, companies, users RESTART IDENTITY CASCADE',
  );
