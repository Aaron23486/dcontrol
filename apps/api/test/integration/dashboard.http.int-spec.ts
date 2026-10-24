import type { INestApplication } from '@nestjs/common';
import { PersonType, Role, type InsideVisit } from '@cedi/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PasswordHasher } from '../../src/auth/password-hasher';
import { Clock } from '../../src/common/time/clock';
import { FakeClock, createTestApp, sessionCookieOf, testConfig } from '../test-app';
import { clearDatabase, createTestPrisma, testDatabaseUrl } from './test-database';

const PASSWORD = 'contraseña-de-prueba-1';
const prisma = createTestPrisma();
// 10:00 del 23 en Ciudad de México (UTC-6): «hoy» empezó a las 06:00 UTC.
const clock = new FakeClock(new Date('2026-10-23T16:00:00Z'));

describe('Dashboard y personas dentro (HTTP contra PostgreSQL)', () => {
  let app: INestApplication;
  let cookie: string;

  const get = (url: string) =>
    request(app.getHttpServer()).get(`/api${url}`).set('Cookie', cookie).expect(200);

  beforeAll(async () => {
    app = await createTestApp({
      config: { ...testConfig, databaseUrl: testDatabaseUrl, timezone: 'America/Mexico_City' },
      overrides: [{ provide: Clock, useValue: clock }],
    });
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    const passwordHash = await new PasswordHasher().hash(PASSWORD);
    const guard = await prisma.user.create({
      data: { name: 'Guarda', email: 'guarda@cedi.test', passwordHash, role: Role.SECURITY },
    });
    cookie = sessionCookieOf(
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'guarda@cedi.test', password: PASSWORD }),
    );
    const company = await prisma.company.create({ data: { name: 'Acme', nameNormalized: 'ACME' } });

    /** Persona trabajador externo con una visita en las horas indicadas (UTC). */
    const visitOf = async (name: string, entryAt: string, exitAt?: string) => {
      const person = await prisma.person.create({
        data: {
          fullName: name,
          nameNormalized: name.toUpperCase(),
          identification: `CED${name.toUpperCase()}`,
          type: PersonType.EXTERNAL_WORKER,
          companyId: company.id,
        },
      });
      await prisma.visit.create({
        data: {
          personId: person.id,
          personType: PersonType.EXTERNAL_WORKER,
          companyId: company.id,
          entryById: guard.id,
          entryAt: new Date(entryAt),
          ...(exitAt && { exitAt: new Date(exitAt), exitById: guard.id }),
        },
      });
    };

    await visitOf('Ana', '2026-10-22T15:00:00Z'); // ayer 09:00, sigue dentro → olvidada
    await visitOf('Beto', '2026-10-23T14:00:00Z', '2026-10-23T15:00:00Z'); // hoy entró y salió
    await visitOf('Caro', '2026-10-23T15:30:00Z'); // hoy, dentro
    await visitOf('Dani', '2026-10-22T13:00:00Z', '2026-10-22T20:00:00Z'); // todo ayer
    await visitOf('Eva', '2026-10-23T05:30:00Z'); // 23:30 de ayer en el CEDI → olvidada
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await app.close();
    await prisma.$disconnect();
  });

  it('resume el día según la hora del CEDI, no según UTC (D6)', async () => {
    const { body } = await get('/dashboard/summary');
    expect(body).toMatchObject({
      insideCount: 3, // Ana, Caro, Eva
      entriesToday: 2, // Beto, Caro (Eva entró ayer en hora local)
      exitsToday: 1, // Beto
      forgottenCount: 2, // Ana, Eva
    });
  });

  it('la actividad reciente mezcla entradas y salidas, de la más nueva a la más antigua', async () => {
    const { body } = await get('/dashboard/summary');
    expect(
      body.recentActivity.map((item: { personName: string; kind: string }) =>
        [item.personName, item.kind].join(' '),
      ),
    ).toEqual([
      'Caro ENTRY',
      'Beto EXIT',
      'Beto ENTRY',
      'Eva ENTRY',
      'Dani EXIT',
      'Ana ENTRY',
      'Dani ENTRY',
    ]);
  });

  it('personas dentro: las olvidadas primero y marcadas (D3)', async () => {
    const { body } = await get('/visits/inside');
    expect(
      body.map((visit: InsideVisit) => [visit.person.fullName, visit.isFromPreviousDay]),
    ).toEqual([
      ['Ana', true],
      ['Eva', true],
      ['Caro', false],
    ]);
    expect(body[2]).toMatchObject({
      personType: PersonType.EXTERNAL_WORKER,
      company: { name: 'Acme' },
      entryAt: '2026-10-23T15:30:00.000Z',
    });
  });

  it('se actualiza cuando alguien sale', async () => {
    await request(app.getHttpServer())
      .post('/api/scans')
      .set('Cookie', cookie)
      .send({ identification: 'CEDCARO', confirmed: true })
      .expect(200);
    const { body } = await get('/dashboard/summary');
    expect(body).toMatchObject({ insideCount: 2, exitsToday: 2 });
  });

  it('sin sesión no se accede', async () => {
    await request(app.getHttpServer()).get('/api/dashboard/summary').expect(401);
    await request(app.getHttpServer()).get('/api/visits/inside').expect(401);
  });
});
