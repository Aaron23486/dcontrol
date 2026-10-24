import type { INestApplication } from '@nestjs/common';
import { AuditAction, ErrorCode, PersonType, Role, type AuditLogItem } from '@cedi/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PasswordHasher } from '../../src/auth/password-hasher';
import { calendarDate } from '../../src/common/time/clock';
import { createTestApp, sessionCookieOf, testConfig } from '../test-app';
import { clearDatabase, createTestPrisma, testDatabaseUrl } from './test-database';

const PASSWORD = 'contraseña-de-prueba-1';
const TIMEZONE = 'America/Mexico_City';
const prisma = createTestPrisma();

describe('Auditoría (HTTP contra PostgreSQL)', () => {
  let app: INestApplication;
  let guardCookie: string;
  let adminCookie: string;
  let guardId: string;
  let adminId: string;
  let personId: string;
  let visitId: string;

  const as = (cookie: string) => ({
    get: (url: string) => request(app.getHttpServer()).get(`/api${url}`).set('Cookie', cookie),
    post: (url: string, body: object) =>
      request(app.getHttpServer()).post(`/api${url}`).set('Cookie', cookie).send(body),
    patch: (url: string, body: object) =>
      request(app.getHttpServer()).patch(`/api${url}`).set('Cookie', cookie).send(body),
  });
  const auditAs = async (query = '') =>
    (await as(adminCookie).get(`/audit${query}`).expect(200)).body.items as AuditLogItem[];

  beforeAll(async () => {
    app = await createTestApp({
      config: { ...testConfig, databaseUrl: testDatabaseUrl, timezone: TIMEZONE },
    });
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    const passwordHash = await new PasswordHasher().hash(PASSWORD);
    const login = async (name: string, email: string, role: Role) => {
      const user = await prisma.user.create({ data: { name, email, passwordHash, role } });
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: PASSWORD });
      return { id: user.id, cookie: sessionCookieOf(response) };
    };
    ({ id: guardId, cookie: guardCookie } = await login('Guarda', 'g@cedi.test', Role.SECURITY));
    ({ id: adminId, cookie: adminCookie } = await login('Admin', 'a@cedi.test', Role.ADMIN));
    const company = (await as(guardCookie).post('/companies', { name: 'Acme' }).expect(201)).body;

    // Operaciones reales que dejan rastro: alta + entrada (guarda) y corrección de nombre (admin).
    const entry = await as(guardCookie)
      .post('/visits', {
        newPerson: {
          fullName: 'Ana Gómez',
          identification: '1234567',
          type: PersonType.VISITOR,
          companyId: company.id,
        },
        details: { personType: PersonType.VISITOR, purpose: 'Reunión', area: 'Oficinas' },
      })
      .expect(201);
    personId = entry.body.person.id;
    visitId = entry.body.visit.id;
    await as(adminCookie).patch(`/persons/${personId}`, { fullName: 'Ana Gómez Ruiz' }).expect(200);
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await app.close();
    await prisma.$disconnect();
  });

  it('Seguridad no puede consultar la auditoría (D12)', async () => {
    const response = await as(guardCookie).get('/audit').expect(403);
    expect(response.body.code).toBe(ErrorCode.FORBIDDEN);
    await as(guardCookie).get('/audit/actors').expect(403);
  });

  it('muestra quién hizo qué, sobre qué persona, de lo más reciente a lo más antiguo', async () => {
    const items = await auditAs();
    expect(items.map((item) => [item.action, item.user.name])).toEqual([
      [AuditAction.PERSON_UPDATED, 'Admin'],
      [AuditAction.VISIT_ENTRY_REGISTERED, 'Guarda'],
      [AuditAction.PERSON_CREATED, 'Guarda'],
    ]);
    expect(items[0]).toMatchObject({
      changedFields: ['fullName'],
      target: { entity: 'PERSON', id: personId, person: { fullName: 'Ana Gómez Ruiz' } },
    });
    expect(items[1]?.target).toMatchObject({
      entity: 'VISIT',
      id: visitId,
      person: { id: personId, identification: '1234567' },
    });
    expect(items[1]?.target.visitEntryAt).toBeTruthy();
  });

  it('guarda los nombres de los campos, nunca los valores (D12)', async () => {
    const log = await prisma.auditLog.findFirstOrThrow({
      where: { action: AuditAction.PERSON_UPDATED },
    });
    expect(JSON.stringify(log)).not.toContain('Ana Gómez');
  });

  it('filtra por acción, por usuario y por registro', async () => {
    expect(await auditAs(`?action=${AuditAction.VISIT_ENTRY_REGISTERED}`)).toHaveLength(1);
    expect((await auditAs(`?userId=${adminId}`)).map((item) => item.action)).toEqual([
      AuditAction.PERSON_UPDATED,
    ]);
    expect((await auditAs(`?userId=${guardId}`)).length).toBe(2);
    expect((await auditAs(`?entityId=${personId}`)).map((item) => item.action)).toEqual([
      AuditAction.PERSON_UPDATED,
      AuditAction.PERSON_CREATED,
    ]);
  });

  it('filtra por días del CEDI', async () => {
    const today = calendarDate(new Date(), TIMEZONE);
    expect(await auditAs(`?from=${today}&to=${today}`)).toHaveLength(3);
    expect(await auditAs('?from=2020-01-01&to=2020-01-31')).toHaveLength(0);
  });

  it('lista los usuarios que tienen registros, para el filtro', async () => {
    const { body } = await as(adminCookie).get('/audit/actors').expect(200);
    expect(body.map((actor: { name: string }) => actor.name)).toEqual(['Admin', 'Guarda']);
  });

  it('valida los filtros', async () => {
    await as(adminCookie).get('/audit?action=BORRAR_TODO').expect(400);
  });
});
