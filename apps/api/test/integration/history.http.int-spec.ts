import type { INestApplication } from '@nestjs/common';
import { ErrorCode, PersonType, Role, normalizeSearchText, type VisitListItem } from '@cedi/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PasswordHasher } from '../../src/auth/password-hasher';
import { createTestApp, sessionCookieOf, testConfig } from '../test-app';
import { clearDatabase, createTestPrisma, testDatabaseUrl } from './test-database';

const PASSWORD = 'contraseña-de-prueba-1';
const prisma = createTestPrisma();

describe('Historial de visitas (HTTP contra PostgreSQL)', () => {
  let app: INestApplication;
  let cookie: string;
  let anaOldVisitId: string;

  const get = (url: string) => request(app.getHttpServer()).get(`/api${url}`).set('Cookie', cookie);
  const list = async (query: string) =>
    ((await get(`/visits?${query}`).expect(200)).body.items as VisitListItem[]).map(
      (visit) => `${visit.person.fullName} ${visit.entryAt.slice(0, 16)}`,
    );

  beforeAll(async () => {
    app = await createTestApp({
      config: { ...testConfig, databaseUrl: testDatabaseUrl, timezone: 'America/Mexico_City' },
    });
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    const passwordHash = await new PasswordHasher().hash(PASSWORD);
    const guard = await prisma.user.create({
      data: { name: 'Guarda Uno', email: 'guarda@cedi.test', passwordHash, role: Role.SECURITY },
    });
    cookie = sessionCookieOf(
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'guarda@cedi.test', password: PASSWORD }),
    );
    const acme = await prisma.company.create({ data: { name: 'Acme', nameNormalized: 'ACME' } });
    const beta = await prisma.company.create({ data: { name: 'Beta', nameNormalized: 'BETA' } });

    const person = (
      fullName: string,
      identification: string,
      type: PersonType,
      companyId: string,
    ) =>
      prisma.person.create({
        data: {
          fullName,
          nameNormalized: normalizeSearchText(fullName),
          identification,
          type,
          companyId,
        },
      });
    const visit = (
      personId: string,
      personType: PersonType,
      companyId: string,
      entryAt: string,
      exitAt?: string,
      extra: object = { purpose: 'Reparación', area: 'Bodega' },
    ) =>
      prisma.visit.create({
        data: {
          personId,
          personType,
          companyId,
          entryById: guard.id,
          entryAt: new Date(entryAt),
          ...(exitAt && { exitAt: new Date(exitAt), exitById: guard.id }),
          ...extra,
        },
      });

    // Ana trabajó para Acme y luego para Beta (R17: cada visita guarda su empresa).
    const ana = await person('Ana Gómez', '1111111', PersonType.CONTRACTOR, beta.id);
    anaOldVisitId = (
      await visit(
        ana.id,
        PersonType.CONTRACTOR,
        acme.id,
        '2026-10-20T15:00:00Z',
        '2026-10-20T20:00:00Z',
        {
          purpose: 'Pintura',
          area: 'Andén 1',
          tools: undefined,
        },
      )
    ).id;
    // 23:30 del 22 en el CEDI (ya es 23 en UTC); sigue dentro.
    await visit(ana.id, PersonType.CONTRACTOR, beta.id, '2026-10-23T05:30:00Z');
    const luis = await person('Luis Díaz', '2222222', PersonType.CONTRACTOR, beta.id);
    await visit(
      luis.id,
      PersonType.CONTRACTOR,
      beta.id,
      '2026-10-22T16:00:00Z',
      '2026-10-22T22:00:00Z',
    );
    const vera = await person('Vera Ruiz', '3333333', PersonType.VISITOR, acme.id);
    await visit(
      vera.id,
      PersonType.VISITOR,
      acme.id,
      '2026-10-22T18:00:00Z',
      '2026-10-22T19:00:00Z',
    );
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await app.close();
    await prisma.$disconnect();
  });

  it('cada sección muestra solo su tipo, de la entrada más reciente a la más antigua', async () => {
    expect(await list('type=CONTRACTOR')).toEqual([
      'Ana Gómez 2026-10-23T05:30',
      'Luis Díaz 2026-10-22T16:00',
      'Ana Gómez 2026-10-20T15:00',
    ]);
    expect(await list('type=VISITOR')).toEqual(['Vera Ruiz 2026-10-22T18:00']);
  });

  it('filtra por días del CEDI: una entrada a las 23:30 locales cuenta en ese día (D6)', async () => {
    expect(await list('type=CONTRACTOR&from=2026-10-22&to=2026-10-22')).toEqual([
      'Ana Gómez 2026-10-23T05:30',
      'Luis Díaz 2026-10-22T16:00',
    ]);
    expect(await list('type=CONTRACTOR&from=2026-10-23&to=2026-10-23')).toEqual([]);
  });

  it('filtra por estado', async () => {
    expect(await list('type=CONTRACTOR&status=INSIDE')).toEqual(['Ana Gómez 2026-10-23T05:30']);
    expect(await list('type=CONTRACTOR&status=EXITED')).toEqual([
      'Luis Díaz 2026-10-22T16:00',
      'Ana Gómez 2026-10-20T15:00',
    ]);
  });

  it('busca por la empresa de cada visita, no la actual de la persona (R17)', async () => {
    expect(await list('type=CONTRACTOR&q=acme')).toEqual(['Ana Gómez 2026-10-20T15:00']);
    expect(await list('type=CONTRACTOR&q=beta')).toEqual([
      'Ana Gómez 2026-10-23T05:30',
      'Luis Díaz 2026-10-22T16:00',
    ]);
  });

  it('busca por nombre sin tildes y por prefijo de cédula', async () => {
    expect(await list('type=CONTRACTOR&q=diaz')).toEqual(['Luis Díaz 2026-10-22T16:00']);
    expect(await list('type=CONTRACTOR&q=111-1')).toHaveLength(2);
  });

  it('pagina los resultados', async () => {
    const { body } = await get('/visits?type=CONTRACTOR&pageSize=2&page=2').expect(200);
    expect(body).toMatchObject({ total: 3, page: 2, pageSize: 2 });
    expect(body.items).toHaveLength(1);
  });

  it('el detalle muestra quién registró la entrada y la salida, y los datos de esa visita', async () => {
    const { body } = await get(`/visits/${anaOldVisitId}`).expect(200);
    expect(body).toMatchObject({
      person: { fullName: 'Ana Gómez', identification: '1111111' },
      company: { name: 'Acme' },
      personType: PersonType.CONTRACTOR,
      purpose: 'Pintura',
      area: 'Andén 1',
      entryBy: { name: 'Guarda Uno' },
      exitBy: { name: 'Guarda Uno' },
      tools: [],
    });
  });

  it('valida los filtros y responde 404 para una visita inexistente', async () => {
    const invalid = await get('/visits?type=CONTRACTOR&from=2026-10-23&to=2026-10-01').expect(400);
    expect(invalid.body.message).toBe('La fecha inicial no puede ser posterior a la final.');
    const missing = await get('/visits/0199f1a2-7c3d-7e4f-8a5b-6c7d8e9f0a1b').expect(404);
    expect(missing.body.code).toBe(ErrorCode.NOT_FOUND);
  });

  it('«/visits/inside» sigue funcionando junto a «/visits/:id»', async () => {
    const { body } = await get('/visits/inside').expect(200);
    expect(body).toHaveLength(1);
  });

  it('sin sesión no se accede', async () => {
    await request(app.getHttpServer()).get('/api/visits?type=CONTRACTOR').expect(401);
  });
});
