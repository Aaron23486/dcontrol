import { Controller, Get, type INestApplication } from '@nestjs/common';
import { ErrorCode, Role } from '@cedi/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Roles } from '../src/auth/decorators/roles.decorator';
import { PasswordHasher } from '../src/auth/password-hasher';
import { SESSION_COOKIE } from '../src/auth/session-cookie';
import { InMemoryUsersRepository } from './in-memory-users.repository';
import { createTestApp, sessionCookieOf, testConfig } from './test-app';

/** Endpoints de prueba para verificar los guards sin depender de módulos futuros. */
@Controller('test-guards')
class GuardProbeController {
  @Get('any')
  any(): { ok: true } {
    return { ok: true };
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  admin(): { ok: true } {
    return { ok: true };
  }
}

const PASSWORD = 'contraseña-de-prueba-1';

describe('Autenticación y autorización (HTTP)', () => {
  let app: INestApplication;
  let users: InMemoryUsersRepository;
  let adminId: string;
  let securityId: string;

  const login = (email: string, password = PASSWORD) =>
    request(app.getHttpServer()).post('/api/auth/login').send({ email, password });

  beforeAll(async () => {
    users = new InMemoryUsersRepository();
    app = await createTestApp({ users, controllers: [GuardProbeController] });

    const passwordHash = await new PasswordHasher().hash(PASSWORD);
    adminId = (
      await users.create({
        name: 'Ana Admin',
        email: 'admin@cedi.test',
        passwordHash,
        role: Role.ADMIN,
      })
    ).id;
    securityId = (
      await users.create({
        name: 'Sergio Seguridad',
        email: 'seguridad@cedi.test',
        passwordHash,
        role: Role.SECURITY,
      })
    ).id;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await users.setActive(adminId, true);
    await users.setActive(securityId, true);
  });

  describe('POST /auth/login', () => {
    it('inicia sesión y entrega una cookie httpOnly y SameSite=Strict', async () => {
      const response = await login('ADMIN@cedi.test').expect(200);
      expect(response.body).toEqual({
        id: adminId,
        name: 'Ana Admin',
        email: 'admin@cedi.test',
        role: Role.ADMIN,
      });
      expect(response.body).not.toHaveProperty('passwordHash');
      const raw = (response.headers['set-cookie'] as unknown as string[]).join(';');
      expect(raw).toMatch(/HttpOnly/i);
      expect(raw).toMatch(/SameSite=Strict/i);
    });

    it('rechaza una contraseña incorrecta con un mensaje genérico', async () => {
      const response = await login('admin@cedi.test', 'otra-contraseña').expect(401);
      expect(response.body).toEqual({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Correo o contraseña incorrectos.',
      });
    });

    it('responde igual para un correo que no existe', async () => {
      const response = await login('nadie@cedi.test').expect(401);
      expect(response.body.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    });

    it('impide iniciar sesión a un usuario desactivado', async () => {
      await users.setActive(securityId, false);
      const response = await login('seguridad@cedi.test').expect(403);
      expect(response.body.code).toBe(ErrorCode.USER_INACTIVE);
    });

    it('valida la entrada con el esquema compartido', async () => {
      const response = await login('no-es-correo').expect(400);
      expect(response.body).toEqual({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Ingresa un correo válido.',
      });
    });
  });

  describe('sesión', () => {
    it('GET /auth/me sin cookie responde 401', async () => {
      const response = await request(app.getHttpServer()).get('/api/auth/me').expect(401);
      expect(response.body.code).toBe(ErrorCode.UNAUTHENTICATED);
    });

    it('GET /auth/me con cookie devuelve el usuario', async () => {
      const cookie = sessionCookieOf(await login('seguridad@cedi.test'));
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', cookie)
        .expect(200);
      expect(response.body.role).toBe(Role.SECURITY);
    });

    it('rechaza una cookie manipulada', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', `${SESSION_COOKIE}=token.falso.firmado`)
        .expect(401);
    });

    it('R14: un usuario desactivado pierde el acceso en la siguiente petición', async () => {
      const cookie = sessionCookieOf(await login('seguridad@cedi.test'));
      await request(app.getHttpServer())
        .get('/api/test-guards/any')
        .set('Cookie', cookie)
        .expect(200);
      await users.setActive(securityId, false);
      const response = await request(app.getHttpServer())
        .get('/api/test-guards/any')
        .set('Cookie', cookie)
        .expect(401);
      expect(response.body.code).toBe(ErrorCode.UNAUTHENTICATED);
    });

    it('POST /auth/logout limpia la cookie', async () => {
      const response = await request(app.getHttpServer()).post('/api/auth/logout').expect(204);
      const raw = (response.headers['set-cookie'] as unknown as string[]).join(';');
      expect(raw).toMatch(new RegExp(`${SESSION_COOKIE}=;`));
    });
  });

  describe('autorización por rol', () => {
    it('SECURITY no puede acceder a un endpoint solo para ADMIN', async () => {
      const cookie = sessionCookieOf(await login('seguridad@cedi.test'));
      const response = await request(app.getHttpServer())
        .get('/api/test-guards/admin')
        .set('Cookie', cookie)
        .expect(403);
      expect(response.body).toEqual({
        code: ErrorCode.FORBIDDEN,
        message: 'No tienes permiso para realizar esta acción.',
      });
    });

    it('ADMIN accede a un endpoint solo para ADMIN', async () => {
      const cookie = sessionCookieOf(await login('admin@cedi.test'));
      await request(app.getHttpServer())
        .get('/api/test-guards/admin')
        .set('Cookie', cookie)
        .expect(200);
    });

    it('sin sesión, un endpoint de ADMIN responde 401 y no 403', async () => {
      await request(app.getHttpServer()).get('/api/test-guards/admin').expect(401);
    });
  });

  describe('errores', () => {
    it('una ruta inexistente responde { code, message }', async () => {
      const cookie = sessionCookieOf(await login('admin@cedi.test'));
      const response = await request(app.getHttpServer())
        .get('/api/no-existe')
        .set('Cookie', cookie)
        .expect(404);
      expect(response.body).toEqual({
        code: ErrorCode.NOT_FOUND,
        message: 'El recurso no existe.',
      });
    });
  });
});

describe('Rate limit de login', () => {
  it('bloquea el login tras superar el límite por minuto', async () => {
    const limit = 3;
    const app = await createTestApp({
      users: new InMemoryUsersRepository(),
      config: { ...testConfig, loginRateLimitPerMinute: limit },
    });
    try {
      const statuses: number[] = [];
      for (let i = 0; i <= limit; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'nadie@cedi.test', password: 'x' });
        statuses.push(response.status);
      }
      expect(statuses).toEqual([401, 401, 401, 429]);
    } finally {
      await app.close();
    }
  });
});
