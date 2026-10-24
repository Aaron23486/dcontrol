import type { INestApplication } from '@nestjs/common';
import { ErrorCode, PersonType, Role, type PersonSummary } from '@cedi/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PasswordHasher } from '../../src/auth/password-hasher';
import { createTestApp, sessionCookieOf, testConfig } from '../test-app';
import { clearDatabase, createTestPrisma, testDatabaseUrl } from './test-database';

const PASSWORD = 'contraseña-de-prueba-1';
const prisma = createTestPrisma();

describe('Personas y empresas (HTTP contra PostgreSQL)', () => {
  let app: INestApplication;
  let guardCookie: string;
  let adminCookie: string;
  let guardId: string;
  let acmeId: string;
  let betaId: string;

  const api = () => request(app.getHttpServer());
  const asGuard = {
    get: (url: string) => api().get(`/api${url}`).set('Cookie', guardCookie),
    post: (url: string, body: object) =>
      api().post(`/api${url}`).set('Cookie', guardCookie).send(body),
    patch: (url: string, body: object) =>
      api().patch(`/api${url}`).set('Cookie', guardCookie).send(body),
  };
  const createPerson = (overrides: object = {}) =>
    asGuard.post('/persons', {
      fullName: 'José Pérez',
      identification: '001-1234567-8',
      type: PersonType.CONTRACTOR,
      companyId: acmeId,
      ...overrides,
    });

  beforeAll(async () => {
    app = await createTestApp({ config: { ...testConfig, databaseUrl: testDatabaseUrl } });
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    const passwordHash = await new PasswordHasher().hash(PASSWORD);
    const login = async (email: string, role: Role) => {
      const user = await prisma.user.create({ data: { name: email, email, passwordHash, role } });
      const response = await api().post('/api/auth/login').send({ email, password: PASSWORD });
      return { id: user.id, cookie: sessionCookieOf(response) };
    };
    ({ id: guardId, cookie: guardCookie } = await login('guarda@cedi.test', Role.SECURITY));
    ({ cookie: adminCookie } = await login('admin@cedi.test', Role.ADMIN));
    acmeId = (await asGuard.post('/companies', { name: 'Acme S.A.' }).expect(201)).body.id;
    betaId = (await asGuard.post('/companies', { name: 'Beta Logística' }).expect(201)).body.id;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await app.close();
    await prisma.$disconnect();
  });

  describe('empresas', () => {
    it('no duplica una empresa escrita de otra forma (D9)', async () => {
      const response = await asGuard.post('/companies', { name: '  acme sa ' }).expect(200);
      expect(response.body).toEqual({ id: acmeId, name: 'Acme S.A.' });
    });

    it('autocompleta sin importar tildes ni mayúsculas', async () => {
      const response = await asGuard.get('/companies?q=logistica').expect(200);
      expect(response.body).toEqual([{ id: betaId, name: 'Beta Logística' }]);
    });

    it('si varias casetas crean la misma empresa a la vez, queda una sola', async () => {
      const responses = await Promise.all(
        ['Gamma S.A.', 'gamma sa', 'GAMMA S.A.', 'Gamma, S.A.'].map((name) =>
          asGuard.post('/companies', { name }),
        ),
      );
      expect(new Set(responses.map((response) => response.body.id)).size).toBe(1);
      expect(responses.every((response) => [200, 201].includes(response.status))).toBe(true);
      expect(await prisma.company.count({ where: { nameNormalized: 'GAMMA SA' } })).toBe(1);
    });
  });

  describe('registrar', () => {
    it('registra la persona con la cédula normalizada', async () => {
      const response = await createPerson().expect(201);
      expect(response.body).toMatchObject({
        fullName: 'José Pérez',
        identification: '00112345678',
        type: PersonType.CONTRACTOR,
        company: { id: acmeId, name: 'Acme S.A.' },
        isInside: false,
        lastVisit: null,
      });
    });

    it('R13: rechaza la misma cédula escrita de otra forma', async () => {
      await createPerson().expect(201);
      const response = await createPerson({ identification: '00112345678' }).expect(409);
      expect(response.body).toEqual({
        code: ErrorCode.CONFLICT,
        message: 'Ya existe una persona registrada con la cédula 00112345678.',
      });
    });

    it('D9: exige empresa también al visitante', async () => {
      const response = await createPerson({
        type: PersonType.VISITOR,
        companyId: undefined,
      }).expect(400);
      expect(response.body.message).toBe('Selecciona la empresa.');
    });

    it('audita la creación', async () => {
      const { body } = await createPerson().expect(201);
      const logs = await prisma.auditLog.findMany({ where: { entityId: body.id } });
      expect(logs).toEqual([
        expect.objectContaining({ userId: guardId, action: 'PERSON_CREATED', entity: 'PERSON' }),
      ]);
    });
  });

  describe('secciones por tipo (spec §15)', () => {
    beforeEach(async () => {
      await createPerson({ fullName: 'José Pérez', identification: '1000001' }).expect(201);
      await createPerson({
        fullName: 'Ana Gómez',
        identification: '2000002',
        type: PersonType.VISITOR,
        companyId: betaId,
      }).expect(201);
      await createPerson({ fullName: 'Luis Díaz', identification: '3000003' }).expect(201);
    });

    const names = (body: { items: PersonSummary[] }) => body.items.map((p) => p.fullName);

    it('cada sección muestra solo su tipo, ordenada por nombre', async () => {
      const contractors = await asGuard.get(`/persons?type=${PersonType.CONTRACTOR}`).expect(200);
      expect(names(contractors.body)).toEqual(['José Pérez', 'Luis Díaz']);
      expect(contractors.body.total).toBe(2);
      const visitors = await asGuard.get(`/persons?type=${PersonType.VISITOR}`).expect(200);
      expect(names(visitors.body)).toEqual(['Ana Gómez']);
    });

    it('D15: busca por nombre sin tildes', async () => {
      const response = await asGuard.get(`/persons?type=${PersonType.CONTRACTOR}&q=perez`);
      expect(names(response.body)).toEqual(['José Pérez']);
    });

    it('busca por prefijo de cédula escrito con guiones', async () => {
      const response = await asGuard.get(`/persons?type=${PersonType.CONTRACTOR}&q=300-0`);
      expect(names(response.body)).toEqual(['Luis Díaz']);
    });

    it('busca por empresa', async () => {
      const response = await asGuard.get(`/persons?type=${PersonType.VISITOR}&q=beta`);
      expect(names(response.body)).toEqual(['Ana Gómez']);
    });

    it('pagina los resultados', async () => {
      const response = await asGuard.get(
        `/persons?type=${PersonType.CONTRACTOR}&pageSize=1&page=2`,
      );
      expect(response.body).toMatchObject({ total: 2, page: 2, pageSize: 1 });
      expect(names(response.body)).toEqual(['Luis Díaz']);
    });

    it('exige indicar la sección', async () => {
      await asGuard.get('/persons').expect(400);
    });
  });

  describe('detalle', () => {
    it('muestra la última visita y el historial con la empresa y el tipo de cada visita (R17)', async () => {
      const { body: person } = await createPerson({
        type: PersonType.MAINTENANCE_TECHNICIAN,
      }).expect(201);
      const old = await prisma.visit.create({
        data: {
          personId: person.id,
          personType: PersonType.MAINTENANCE_TECHNICIAN,
          companyId: acmeId,
          entryById: guardId,
          entryAt: new Date('2026-10-01T13:00:00Z'),
          exitAt: new Date('2026-10-01T18:00:00Z'),
          exitById: guardId,
          purpose: 'Revisión',
          area: 'Cuarto eléctrico',
          tools: { create: [{ name: 'Multímetro', quantity: 1 }, { name: 'Escalera' }] },
        },
      });
      await asGuard.patch(`/persons/${person.id}`, { companyId: betaId }).expect(200);
      await prisma.visit.create({
        data: {
          personId: person.id,
          personType: PersonType.MAINTENANCE_TECHNICIAN,
          companyId: betaId,
          entryById: guardId,
          purpose: 'Mantenimiento',
          area: 'Andén 2',
        },
      });

      const detail = (await asGuard.get(`/persons/${person.id}`).expect(200)).body;
      expect(detail.isInside).toBe(true);
      expect(detail.company.name).toBe('Beta Logística');
      expect(detail.lastVisit).toMatchObject({
        purpose: 'Mantenimiento',
        exitAt: null,
        toolsCount: 0,
      });
      expect(detail.visits).toHaveLength(2);
      expect(detail.visits[1]).toMatchObject({
        id: old.id,
        company: { name: 'Acme S.A.' },
        purpose: 'Revisión',
        tools: [
          { name: 'Escalera', description: null, quantity: null },
          { name: 'Multímetro', description: null, quantity: 1 },
        ],
      });
    });

    it('persona inexistente: 404', async () => {
      const response = await asGuard
        .get('/persons/0199f1a2-7c3d-7e4f-8a5b-6c7d8e9f0a1b')
        .expect(404);
      expect(response.body.code).toBe(ErrorCode.NOT_FOUND);
    });
  });

  describe('editar (D13)', () => {
    let personId: string;
    beforeEach(async () => {
      personId = (await createPerson()).body.id;
    });

    it('Seguridad cambia tipo y empresa, y se auditan solo los nombres de los campos', async () => {
      const response = await asGuard
        .patch(`/persons/${personId}`, { type: PersonType.VISITOR, companyId: betaId })
        .expect(200);
      expect(response.body).toMatchObject({ type: PersonType.VISITOR, company: { id: betaId } });
      const log = await prisma.auditLog.findFirstOrThrow({ where: { action: 'PERSON_UPDATED' } });
      expect(log.changedFields).toEqual(['type', 'companyId']);
      expect(JSON.stringify(log)).not.toContain(betaId);
    });

    it('Seguridad no puede corregir el nombre', async () => {
      const response = await asGuard
        .patch(`/persons/${personId}`, { fullName: 'Otro Nombre' })
        .expect(403);
      expect(response.body.message).toBe(
        'Solo un administrador puede corregir el nombre o la cédula.',
      );
    });

    it('Administrador corrige nombre y cédula; la búsqueda usa el nombre nuevo', async () => {
      await api()
        .patch(`/api/persons/${personId}`)
        .set('Cookie', adminCookie)
        .send({ fullName: 'José Pérez Núñez', identification: '7777777' })
        .expect(200);
      const response = await asGuard.get(`/persons?type=${PersonType.CONTRACTOR}&q=nunez`);
      expect(response.body.items).toEqual([
        expect.objectContaining({ fullName: 'José Pérez Núñez', identification: '7777777' }),
      ]);
    });

    it('Administrador no puede asignar una cédula que ya tiene otra persona', async () => {
      await createPerson({ fullName: 'Otra Persona', identification: '5555555' }).expect(201);
      await api()
        .patch(`/api/persons/${personId}`)
        .set('Cookie', adminCookie)
        .send({ identification: '555-5555' })
        .expect(409);
    });
  });

  it('sin sesión no se accede a personas ni empresas', async () => {
    await api().get(`/api/persons?type=${PersonType.VISITOR}`).expect(401);
    await api().get('/api/companies').expect(401);
  });
});
