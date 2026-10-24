import type { INestApplication } from '@nestjs/common';
import { ErrorCode, PersonType, Role, ScanResultCode } from '@cedi/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PasswordHasher } from '../../src/auth/password-hasher';
import { Clock } from '../../src/common/time/clock';
import { FakeClock, createTestApp, sessionCookieOf, testConfig } from '../test-app';
import { clearDatabase, createTestPrisma, testDatabaseUrl } from './test-database';

const PASSWORD = 'contraseña-de-prueba-1';
const SECOND = 1000;
const prisma = createTestPrisma();
const clock = new FakeClock();

describe('Ingreso y salida por cédula (HTTP contra PostgreSQL)', () => {
  let app: INestApplication;
  let cookie: string;
  let guardId: string;
  let companyId: string;

  const post = (url: string, body: object) =>
    request(app.getHttpServer()).post(`/api${url}`).set('Cookie', cookie).send(body);
  const scan = (identification: string, confirmed = false) =>
    post('/scans', { identification, confirmed }).expect(200);
  const closeVisit = (id: string, exitAt: string) =>
    request(app.getHttpServer())
      .patch(`/api/visits/${id}/close`)
      .set('Cookie', cookie)
      .send({ exitAt });

  const newPerson = (type: PersonType, identification = '1234567') => ({
    fullName: 'Ana Gómez',
    identification,
    type,
    companyId,
  });
  const detailsFor = (type: PersonType, extra: object = {}) =>
    type === PersonType.EXTERNAL_WORKER
      ? { personType: type }
      : { personType: type, purpose: 'Reparación', area: 'Bodega', ...extra };

  /** Registra a una persona nueva con su primera entrada y devuelve su id. */
  const registerNew = async (type: PersonType, identification = '1234567') =>
    (
      await post('/visits', {
        newPerson: newPerson(type, identification),
        details: detailsFor(type),
      }).expect(201)
    ).body.person.id as string;

  beforeAll(async () => {
    app = await createTestApp({
      config: { ...testConfig, databaseUrl: testDatabaseUrl, timezone: 'America/Mexico_City' },
      overrides: [{ provide: Clock, useValue: clock }],
    });
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    clock.set('2026-10-23T15:00:00Z'); // 09:00 en Ciudad de México
    const passwordHash = await new PasswordHasher().hash(PASSWORD);
    guardId = (
      await prisma.user.create({
        data: { name: 'Guarda', email: 'guarda@cedi.test', passwordHash, role: Role.SECURITY },
      })
    ).id;
    cookie = sessionCookieOf(
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'guarda@cedi.test', password: PASSWORD }),
    );
    companyId = (await prisma.company.create({ data: { name: 'Acme', nameNormalized: 'ACME' } }))
      .id;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await app.close();
    await prisma.$disconnect();
  });

  describe('persona no registrada (spec §10)', () => {
    it('informa que la cédula no existe, ya normalizada', async () => {
      expect((await scan('001-123-4567')).body).toEqual({
        result: ScanResultCode.PERSON_NOT_FOUND,
        identification: '0011234567',
      });
    });

    it('registra a la persona y su primera entrada juntas; la visita copia tipo y empresa (R17)', async () => {
      const response = await post('/visits', {
        newPerson: newPerson(PersonType.CONTRACTOR),
        details: detailsFor(PersonType.CONTRACTOR),
      }).expect(201);
      expect(response.body.person).toMatchObject({ isInside: true, type: PersonType.CONTRACTOR });
      expect(response.body.visit).toMatchObject({
        personType: PersonType.CONTRACTOR,
        company: { id: companyId },
        entryAt: '2026-10-23T15:00:00.000Z',
        exitAt: null,
        purpose: 'Reparación',
        area: 'Bodega',
      });
      const actions = (await prisma.auditLog.findMany({ orderBy: { createdAt: 'asc' } })).map(
        (log) => log.action,
      );
      expect(actions.sort()).toEqual(['PERSON_CREATED', 'VISIT_ENTRY_REGISTERED']);
    });

    it('si la cédula ya existe no crea nada (todo o nada)', async () => {
      await registerNew(PersonType.CONTRACTOR);
      await post('/visits', {
        newPerson: newPerson(PersonType.VISITOR),
        details: detailsFor(PersonType.VISITOR),
      }).expect(409);
      expect(await prisma.person.count()).toBe(1);
      expect(await prisma.visit.count()).toBe(1);
    });

    it('si faltan datos de la visita no crea a la persona', async () => {
      await post('/visits', {
        newPerson: newPerson(PersonType.CONTRACTOR),
        details: { personType: PersonType.CONTRACTOR, purpose: 'Reparación' },
      }).expect(400);
      expect(await prisma.person.count()).toBe(0);
    });
  });

  describe('salida y entrada de una persona registrada', () => {
    it('ciclo completo: salida automática, nueva entrada con datos prellenados (D1)', async () => {
      const personId = await registerNew(PersonType.CONTRACTOR);

      clock.advance(4 * 60 * 60 * SECOND);
      const exit = await scan('1234567');
      expect(exit.body).toMatchObject({
        result: ScanResultCode.EXIT_REGISTERED,
        person: { id: personId, isInside: false },
        visit: { exitAt: '2026-10-23T19:00:00.000Z' },
      });

      clock.advance(60 * 60 * SECOND);
      const pending = await scan('1234567');
      expect(pending.body).toMatchObject({
        result: ScanResultCode.ENTRY_PENDING,
        prefill: { purpose: 'Reparación', area: 'Bodega' },
      });

      await post('/visits', {
        personId,
        details: detailsFor(PersonType.CONTRACTOR, { purpose: 'Pintura' }),
      }).expect(201);
      const visits = await prisma.visit.findMany({
        where: { personId },
        orderBy: { entryAt: 'asc' },
      });
      expect(visits.map((v) => [v.purpose, v.exitById === guardId])).toEqual([
        ['Reparación', true],
        ['Pintura', false],
      ]);
    });

    it('trabajador externo: entrada sin datos adicionales y sin prellenado', async () => {
      const personId = await registerNew(PersonType.EXTERNAL_WORKER);
      clock.advance(2 * 60 * 60 * SECOND);
      await scan('1234567');
      clock.advance(60 * 60 * SECOND);
      expect((await scan('1234567')).body).toMatchObject({
        result: ScanResultCode.ENTRY_PENDING,
        prefill: null,
      });
      await post('/visits', { personId, details: detailsFor(PersonType.EXTERNAL_WORKER) }).expect(
        201,
      );
    });
  });

  describe('D2: doble escaneo', () => {
    it('pide confirmación si la entrada fue hace menos de 60 s; confirmado, registra la salida', async () => {
      await registerNew(PersonType.VISITOR);
      clock.advance(30 * SECOND);
      expect((await scan('1234567')).body).toMatchObject({
        result: ScanResultCode.CONFIRMATION_REQUIRED,
        pendingAction: 'EXIT',
      });
      expect(await prisma.visit.count({ where: { exitAt: null } })).toBe(1);
      expect((await scan('1234567', true)).body.result).toBe(ScanResultCode.EXIT_REGISTERED);
    });

    it('pide confirmación si la salida fue hace menos de 60 s', async () => {
      await registerNew(PersonType.VISITOR);
      clock.advance(2 * 60 * SECOND);
      await scan('1234567');
      clock.advance(10 * SECOND);
      expect((await scan('1234567')).body).toMatchObject({
        result: ScanResultCode.CONFIRMATION_REQUIRED,
        pendingAction: 'ENTRY',
      });
      expect((await scan('1234567', true)).body.result).toBe(ScanResultCode.ENTRY_PENDING);
    });
  });

  describe('R1: nunca dos visitas abiertas', () => {
    it('rechaza una segunda entrada', async () => {
      const personId = await registerNew(PersonType.EXTERNAL_WORKER);
      const response = await post('/visits', {
        personId,
        details: detailsFor(PersonType.EXTERNAL_WORKER),
      }).expect(409);
      expect(response.body).toEqual({
        code: ErrorCode.CONFLICT,
        message: 'Ana Gómez ya está dentro del CEDI.',
      });
    });

    it('con varias casetas registrando a la vez solo una entrada prospera', async () => {
      const personId = await registerNew(PersonType.EXTERNAL_WORKER);
      clock.advance(60 * 60 * SECOND);
      await scan('1234567');
      const responses = await Promise.all(
        Array.from({ length: 5 }, () =>
          post('/visits', { personId, details: detailsFor(PersonType.EXTERNAL_WORKER) }),
        ),
      );
      expect(responses.map((r) => r.status).sort()).toEqual([201, 409, 409, 409, 409]);
      expect(await prisma.visit.count({ where: { personId, exitAt: null } })).toBe(1);
    });
  });

  describe('R18 y R19: datos de la visita según el tipo', () => {
    it('rechaza datos de otro tipo (la persona cambió de tipo)', async () => {
      const personId = await registerNew(PersonType.VISITOR);
      clock.advance(60 * 60 * SECOND);
      await scan('1234567');
      const response = await post('/visits', {
        personId,
        details: detailsFor(PersonType.EXTERNAL_WORKER),
      }).expect(400);
      expect(response.body.message).toMatch(/no corresponden al tipo/);
    });

    it('rechaza herramientas para un visitante', async () => {
      await post('/visits', {
        newPerson: newPerson(PersonType.VISITOR),
        details: detailsFor(PersonType.VISITOR, { tools: [{ name: 'Taladro' }] }),
      }).expect(400);
    });

    it('guarda las herramientas del técnico', async () => {
      const response = await post('/visits', {
        newPerson: newPerson(PersonType.MAINTENANCE_TECHNICIAN),
        details: detailsFor(PersonType.MAINTENANCE_TECHNICIAN, {
          tools: [
            { name: 'Taladro', quantity: 2 },
            { name: 'Escalera', description: 'Tijera' },
          ],
        }),
      }).expect(201);
      expect(response.body.visit.tools).toEqual([
        { name: 'Escalera', description: 'Tijera', quantity: null },
        { name: 'Taladro', description: null, quantity: 2 },
      ]);
    });

    it('Fase 7: al registrar la salida devuelve las herramientas con que entró', async () => {
      await post('/visits', {
        newPerson: newPerson(PersonType.MAINTENANCE_TECHNICIAN),
        details: detailsFor(PersonType.MAINTENANCE_TECHNICIAN, {
          tools: [{ name: 'Taladro', quantity: 2 }],
        }),
      }).expect(201);
      clock.advance(3 * 60 * 60 * SECOND);
      const exit = await scan('1234567');
      expect(exit.body).toMatchObject({
        result: ScanResultCode.EXIT_REGISTERED,
        visit: { tools: [{ name: 'Taladro', description: null, quantity: 2 }] },
      });
    });
  });

  describe('D3: visita olvidada de un día anterior', () => {
    beforeEach(async () => {
      clock.set('2026-10-22T16:00:00Z'); // 10:00 del 22 en Ciudad de México
      await registerNew(PersonType.CONTRACTOR);
      clock.set('2026-10-23T14:00:00Z'); // 08:00 del 23
    });

    it('avisa de la visita pendiente en lugar de registrar la salida', async () => {
      const response = await scan('1234567');
      expect(response.body).toMatchObject({
        result: ScanResultCode.PREVIOUS_DAY_VISIT_OPEN,
        visit: { entryAt: '2026-10-22T16:00:00.000Z', exitAt: null },
      });
      expect(await prisma.visit.count({ where: { exitAt: null } })).toBe(1);
    });

    it('se cierra a mano con la hora real de salida (auditado) y luego entra de nuevo', async () => {
      const { visit } = (await scan('1234567')).body;
      const closed = await closeVisit(visit.id, '2026-10-22T18:00:00-06:00').expect(200);
      expect(closed.body.exitAt).toBe('2026-10-23T00:00:00.000Z');
      expect(
        await prisma.auditLog.count({
          where: { action: 'VISIT_CLOSED_MANUALLY', entityId: visit.id },
        }),
      ).toBe(1);
      expect((await scan('1234567')).body.result).toBe(ScanResultCode.ENTRY_PENDING);
    });

    it('confirmado, registra la salida con la hora actual', async () => {
      const response = await scan('1234567', true);
      expect(response.body).toMatchObject({
        result: ScanResultCode.EXIT_REGISTERED,
        visit: { exitAt: '2026-10-23T14:00:00.000Z' },
      });
    });

    it('valida la hora de salida manual', async () => {
      const { visit } = (await scan('1234567')).body;
      expect(
        (await closeVisit(visit.id, '2026-10-22T09:00:00-06:00').expect(400)).body.message,
      ).toMatch(/anterior a la entrada \(22\/10\/26, 10:00\)/);
      await closeVisit(visit.id, '2026-10-24T09:00:00-06:00').expect(400);
    });

    it('R2: no se puede cerrar una visita que ya tiene salida', async () => {
      const { visit } = (await scan('1234567')).body;
      await closeVisit(visit.id, '2026-10-22T18:00:00-06:00').expect(200);
      const response = await closeVisit(visit.id, '2026-10-22T19:00:00-06:00').expect(409);
      expect(response.body.message).toBe('Esta visita ya tiene la salida registrada.');
    });
  });

  describe('SEC-03: el cierre manual es solo para visitas de días anteriores', () => {
    it('una visita de hoy no se cierra a mano ni con una hora pasada', async () => {
      clock.set('2026-10-23T14:00:00Z'); // 08:00 del 23 en Ciudad de México
      await registerNew(PersonType.CONTRACTOR);
      clock.set('2026-10-23T20:00:00Z'); // 14:00 del mismo día
      const visit = await prisma.visit.findFirstOrThrow({ where: { exitAt: null } });

      const response = await closeVisit(visit.id, '2026-10-23T09:00:00-06:00').expect(409);
      expect(response.body).toEqual({
        code: ErrorCode.CONFLICT,
        message:
          'Solo se cierran a mano las visitas de días anteriores. Para registrar la salida de hoy, ingresa su cédula.',
      });
      expect((await prisma.visit.findUniqueOrThrow({ where: { id: visit.id } })).exitAt).toBeNull();
      expect(await prisma.auditLog.count({ where: { action: 'VISIT_CLOSED_MANUALLY' } })).toBe(0);
    });

    it('cuenta el día en la hora del CEDI: entrar a las 23:30 permite cerrarla a las 00:15', async () => {
      clock.set('2026-10-23T05:30:00Z'); // 23:30 del 22 en Ciudad de México
      await registerNew(PersonType.VISITOR);
      clock.set('2026-10-23T06:15:00Z'); // 00:15 del 23
      const visit = await prisma.visit.findFirstOrThrow({ where: { exitAt: null } });
      await closeVisit(visit.id, '2026-10-22T23:50:00-06:00').expect(200);
    });
  });

  describe('D3 y D6: el día se cuenta en la hora del CEDI, no en UTC', () => {
    it('entrar a las 23:30 y pasar a las 00:15 es una visita del día anterior', async () => {
      clock.set('2026-10-23T05:30:00Z'); // 23:30 del 22 en Ciudad de México
      await registerNew(PersonType.VISITOR);
      clock.set('2026-10-23T06:15:00Z'); // 00:15 del 23
      expect((await scan('1234567')).body.result).toBe(ScanResultCode.PREVIOUS_DAY_VISIT_OPEN);
    });

    it('entrar a las 08:00 y salir a las 23:50 del mismo día registra la salida', async () => {
      clock.set('2026-10-22T14:00:00Z'); // 08:00 del 22
      await registerNew(PersonType.VISITOR);
      clock.set('2026-10-23T05:50:00Z'); // 23:50 del 22 (ya es 23 en UTC)
      expect((await scan('1234567')).body.result).toBe(ScanResultCode.EXIT_REGISTERED);
    });
  });

  it('sin sesión no se puede escanear ni registrar', async () => {
    await request(app.getHttpServer())
      .post('/api/scans')
      .send({ identification: '1234' })
      .expect(401);
    await request(app.getHttpServer()).post('/api/visits').send({}).expect(401);
  });
});
