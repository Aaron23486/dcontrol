import type { INestApplication } from '@nestjs/common';
import { ErrorCode, Role } from '@cedi/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PasswordHasher } from '../../src/auth/password-hasher';
import { UserAccountError, UserAccountsService } from '../../src/users/user-accounts.service';
import { PrismaUsersRepository } from '../../src/users/users.repository';
import { createTestApp, sessionCookieOf, testConfig } from '../test-app';
import { clearDatabase, createTestPrisma, testDatabaseUrl } from './test-database';

const PASSWORD = 'contraseña-de-prueba-1';
const prisma = createTestPrisma();
// El mismo servicio que usa `npm run users`, sobre la base real (NFR-8: administrar usuarios).
const accounts = new UserAccountsService(new PrismaUsersRepository(prisma), new PasswordHasher());

describe('Cuentas de usuario contra PostgreSQL (npm run users)', () => {
  let app: INestApplication;

  const login = (email: string, password = PASSWORD) =>
    request(app.getHttpServer()).post('/api/auth/login').send({ email, password });

  beforeAll(async () => {
    app = await createTestApp({ config: { ...testConfig, databaseUrl: testDatabaseUrl } });
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    await accounts.create({
      name: 'Admin',
      email: 'admin@cedi.test',
      password: PASSWORD,
      role: Role.ADMIN,
    });
    await accounts.create({
      name: 'Guarda',
      email: 'guarda@cedi.test',
      password: PASSWORD,
      role: Role.SECURITY,
    });
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await app.close();
    await prisma.$disconnect();
  });

  it('crea cuentas que pueden iniciar sesión, sin exponer el hash', async () => {
    const list = await accounts.list();
    expect(list.map((user) => [user.email, user.role, user.isActive])).toEqual([
      ['admin@cedi.test', Role.ADMIN, true],
      ['guarda@cedi.test', Role.SECURITY, true],
    ]);
    list.forEach((user) => expect(user).not.toHaveProperty('passwordHash'));
    await login('guarda@cedi.test').expect(200);
  });

  it('rechaza un correo repetido', async () => {
    await expect(
      accounts.create({
        name: 'Otro',
        email: 'guarda@cedi.test',
        password: PASSWORD,
        role: Role.SECURITY,
      }),
    ).rejects.toThrow(UserAccountError);
  });

  it('R14: un guarda desactivado pierde el acceso en su siguiente petición', async () => {
    const cookie = sessionCookieOf(await login('guarda@cedi.test'));
    await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', cookie).expect(200);
    await accounts.setActive('guarda@cedi.test', false);
    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(401);
    expect(response.body.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect((await login('guarda@cedi.test').expect(403)).body.code).toBe(ErrorCode.USER_INACTIVE);

    await accounts.setActive('guarda@cedi.test', true);
    await login('guarda@cedi.test').expect(200);
  });

  it('R15: no se puede desactivar al último administrador activo', async () => {
    await expect(accounts.setActive('admin@cedi.test', false)).rejects.toThrow(
      /último administrador activo/,
    );
    await accounts.create({
      name: 'Admin 2',
      email: 'admin2@cedi.test',
      password: PASSWORD,
      role: Role.ADMIN,
    });
    await expect(accounts.setActive('admin@cedi.test', false)).resolves.toMatchObject({
      isActive: false,
    });
    await expect(accounts.setActive('admin2@cedi.test', false)).rejects.toThrow(
      /último administrador activo/,
    );
  });

  it('restablecer la contraseña cierra las sesiones abiertas (docs/security.md)', async () => {
    const stolen = sessionCookieOf(await login('guarda@cedi.test'));
    await accounts.resetPassword('guarda@cedi.test', 'otra-contraseña-segura');
    await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', stolen).expect(401);

    // Una sesión nueva, iniciada justo después del cambio, sí vale.
    const fresh = sessionCookieOf(await login('guarda@cedi.test', 'otra-contraseña-segura'));
    await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', fresh).expect(200);
  });

  it('desactivar y reactivar no revive las sesiones anteriores', async () => {
    const old = sessionCookieOf(await login('guarda@cedi.test'));
    await accounts.setActive('guarda@cedi.test', false);
    await accounts.setActive('guarda@cedi.test', true);
    await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', old).expect(401);
  });

  it('restablece la contraseña: la anterior deja de funcionar', async () => {
    await accounts.resetPassword('guarda@cedi.test', 'otra-contraseña-segura');
    await login('guarda@cedi.test').expect(401);
    await login('guarda@cedi.test', 'otra-contraseña-segura').expect(200);
  });
});

describe('Chequeo de salud contra PostgreSQL', () => {
  it('responde ok cuando la base de datos contesta', async () => {
    const app = await createTestApp({ config: { ...testConfig, databaseUrl: testDatabaseUrl } });
    try {
      const response = await request(app.getHttpServer()).get('/api/health').expect(200);
      expect(response.body).toEqual({ status: 'ok' });
    } finally {
      await app.close();
    }
  });
});
