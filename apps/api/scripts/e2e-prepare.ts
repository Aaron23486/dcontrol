/**
 * Prepara la base de pruebas (DATABASE_URL_TEST) para las pruebas e2e de Playwright:
 * aplica migraciones, la vacía y crea los datos que cada escenario necesita.
 * Nunca toca la base de desarrollo.
 *
 *   npm run e2e:prepare -w @cedi/api            (antes de las pruebas)
 *   npm run e2e:prepare -w @cedi/api -- --clean (al terminar: deja la base vacía)
 */
import { PersonType, Role, normalizeCompanyName, normalizeSearchText } from '@cedi/shared';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PasswordHasher } from '../src/auth/password-hasher';
import { calendarDate, startOfLocalDate } from '../src/common/time/clock';
import { loadEnvFile } from '../src/config/load-env-file';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserAccountsService } from '../src/users/user-accounts.service';
import { PrismaUsersRepository } from '../src/users/users.repository';

const HOUR = 60 * 60 * 1000;

async function main(): Promise<void> {
  loadEnvFile();
  const url = process.env.DATABASE_URL_TEST;
  const password = process.env.E2E_PASSWORD;
  const timezone = process.env.CEDI_TIMEZONE ?? 'America/Mexico_City';
  if (!url) throw new Error('Falta DATABASE_URL_TEST.');
  if (!password && !process.argv.includes('--clean')) throw new Error('Falta E2E_PASSWORD.');
  if (url === process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL_TEST no puede ser la base de desarrollo.');
  }

  execSync('npx prisma migrate deploy', {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });

  const prisma = new PrismaService({ databaseUrl: url });
  try {
    await prisma.$executeRawUnsafe(
      'TRUNCATE visit_tools, visits, audit_logs, persons, companies, users RESTART IDENTITY CASCADE',
    );
    // Datos sobrantes en la base de pruebas pueden hacer fallar una migración futura.
    if (process.argv.includes('--clean')) {
      console.log('Base de pruebas e2e vaciada.');
      return;
    }
    const accounts = new UserAccountsService(
      new PrismaUsersRepository(prisma),
      new PasswordHasher(),
    );
    const guard = await accounts.create({
      name: 'Guarda E2E',
      email: 'guarda.e2e@cedi.test',
      password: password as string,
      role: Role.SECURITY,
    });
    await accounts.create({
      name: 'Admin E2E',
      email: 'admin.e2e@cedi.test',
      password: password as string,
      role: Role.ADMIN,
    });
    const company = await prisma.company.create({
      data: { name: 'Acme Logística', nameNormalized: normalizeCompanyName('Acme Logística') },
    });

    const now = Date.now();
    const yesterday = calendarDate(new Date(now - 24 * HOUR), timezone);
    const yesterdayAt10 = new Date(startOfLocalDate(yesterday, timezone).getTime() + 10 * HOUR);

    const person = (fullName: string, identification: string, type: PersonType) =>
      prisma.person.create({
        data: {
          fullName,
          nameNormalized: normalizeSearchText(fullName),
          identification,
          type,
          companyId: company.id,
        },
      });
    const visitBase = (personId: string, personType: PersonType) => ({
      personId,
      personType,
      companyId: company.id,
      entryById: guard.id,
    });

    // D1: contratista con una visita anterior ya cerrada, para el prellenado.
    const rosa = await person('Rosa Prellenado', 'E2E0001', PersonType.CONTRACTOR);
    await prisma.visit.create({
      data: {
        ...visitBase(rosa.id, PersonType.CONTRACTOR),
        entryAt: new Date(now - 5 * HOUR),
        exitAt: new Date(now - 3 * HOUR),
        exitById: guard.id,
        purpose: 'Pintura de andén',
        area: 'Andén 4',
      },
    });

    // Fase 7: técnico dentro (desde hace 5 minutos) con herramientas.
    const tomas = await person('Tomás Herramientas', 'E2E0002', PersonType.MAINTENANCE_TECHNICIAN);
    await prisma.visit.create({
      data: {
        ...visitBase(tomas.id, PersonType.MAINTENANCE_TECHNICIAN),
        entryAt: new Date(now - 5 * 60 * 1000),
        purpose: 'Revisión de montacargas',
        area: 'Taller',
        tools: { create: [{ name: 'Taladro', quantity: 2 }, { name: 'Multímetro' }] },
      },
    });

    // D3: visitante que sigue «dentro» desde ayer a las 10:00.
    const olga = await person('Olga Olvidada', 'E2E0003', PersonType.VISITOR);
    await prisma.visit.create({
      data: {
        ...visitBase(olga.id, PersonType.VISITOR),
        entryAt: yesterdayAt10,
        purpose: 'Reunión',
        area: 'Oficinas',
      },
    });
    console.log('Base de pruebas e2e preparada.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
