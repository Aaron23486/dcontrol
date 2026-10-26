import { Controller, Get, type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode, Role } from '@cedi/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SESSION_TOKEN } from '../src/auth/auth.module';
import { Roles } from '../src/auth/decorators/roles.decorator';
import { PasswordHasher } from '../src/auth/password-hasher';
import { SESSION_COOKIE } from '../src/auth/session-cookie';
import { Clock } from '../src/common/time/clock';
import { SecurityEventSink, type SecurityEvent } from '../src/security/security-events';
import { InMemoryUsersRepository } from './in-memory-users.repository';
import { FakeClock, createTestApp, sessionCookieOf, testConfig } from './test-app';

@Controller('test-security')
class AdminProbeController {
  @Roles(Role.ADMIN)
  @Get('admin')
  admin(): { ok: true } {
    return { ok: true };
  }
}

class MemorySink extends SecurityEventSink {
  events: SecurityEvent[] = [];
  write(event: SecurityEvent): void {
    this.events.push(event);
  }
  names(): string[] {
    return this.events.map((e) => e.event);
  }
}

const PASSWORD = 'contraseña-de-prueba-1';
const MAX_FAILURES = 3;

describe('Seguridad de la API: SEC-04, SEC-05 y SEC-06 (HTTP)', () => {
  let app: INestApplication;
  const sink = new MemorySink();
  const clock = new FakeClock();
  let users: InMemoryUsersRepository;
  let securityId: string;

  const server = () => app.getHttpServer();
  const login = (email: string, password = PASSWORD) =>
    request(server()).post('/api/auth/login').send({ email, password });

  beforeAll(async () => {
    users = new InMemoryUsersRepository();
    app = await createTestApp({
      users,
      controllers: [AdminProbeController],
      config: { ...testConfig, loginMaxFailuresPerAccount: MAX_FAILURES, loginLockoutMinutes: 15 },
      overrides: [
        { provide: SecurityEventSink, useValue: sink },
        { provide: Clock, useValue: clock },
      ],
    });
    const passwordHash = await new PasswordHasher().hash(PASSWORD);
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

  beforeEach(() => {
    sink.events = [];
    // Cada prueba empieza fuera de cualquier bloqueo anterior.
    clock.advance(60 * 60 * 1000);
  });

  describe('SEC-05: bloqueo temporal por cuenta', () => {
    it('tras varios fallos bloquea el correo, aun con la contraseña correcta, y luego se libera', async () => {
      for (let i = 0; i < MAX_FAILURES; i++) await login('seguridad@cedi.test', 'mala').expect(401);
      const blocked = await login('seguridad@cedi.test').expect(429);
      expect(blocked.body.code).toBe(ErrorCode.TOO_MANY_REQUESTS);
      expect(sink.names()).toContain('auth.account_locked');
      expect(sink.names()).toContain('auth.login_blocked');

      clock.advance(15 * 60 * 1000);
      await login('seguridad@cedi.test').expect(200);
    });

    it('bloquea igual un correo que no existe (no revela qué cuentas son reales)', async () => {
      for (let i = 0; i < MAX_FAILURES; i++) await login('nadie@cedi.test', 'mala').expect(401);
      expect((await login('nadie@cedi.test', 'mala').expect(429)).body.code).toBe(
        ErrorCode.TOO_MANY_REQUESTS,
      );
    });

    it('el bloqueo de un correo no afecta a otro', async () => {
      for (let i = 0; i < MAX_FAILURES; i++) await login('otro@cedi.test', 'mala').expect(401);
      await login('seguridad@cedi.test').expect(200);
    });
  });

  describe('SEC-04: eventos de seguridad', () => {
    it('registra logins fallidos y correctos y el cierre de sesión, sin contraseñas ni tokens', async () => {
      await login('seguridad@cedi.test', 'contraseña-equivocada').expect(401);
      const cookie = sessionCookieOf(await login('seguridad@cedi.test').expect(200));
      await request(server()).post('/api/auth/logout').set('Cookie', cookie).expect(204);

      expect(sink.events).toEqual([
        expect.objectContaining({
          event: 'auth.login_failed',
          email: 'seguridad@cedi.test',
          reason: 'wrong_password',
        }),
        expect.objectContaining({ event: 'auth.login_succeeded', userId: securityId }),
        expect.objectContaining({ event: 'auth.logout', userId: securityId }),
      ]);
      const logged = JSON.stringify(sink.events);
      expect(logged).not.toContain('contraseña');
      expect(logged).not.toContain(cookie.split('=')[1]);
    });

    it('registra un acceso denegado por rol con usuario y ruta sin parámetros', async () => {
      const cookie = sessionCookieOf(await login('seguridad@cedi.test').expect(200));
      sink.events = [];
      await request(server())
        .get('/api/test-security/admin?q=Ana%20G%C3%B3mez')
        .set('Cookie', cookie)
        .expect(403);
      expect(sink.events).toEqual([
        expect.objectContaining({
          event: 'access.forbidden',
          userId: securityId,
          reason: Role.SECURITY,
          method: 'GET',
          path: '/api/test-security/admin',
        }),
      ]);
    });

    it('registra una sesión rechazada solo si se presentó una cookie', async () => {
      await request(server()).get('/api/auth/me').expect(401);
      expect(sink.events).toEqual([]);
      await request(server())
        .get('/api/auth/me')
        .set('Cookie', `${SESSION_COOKIE}=token.falso.firmado`)
        .expect(401);
      expect(sink.names()).toEqual(['auth.session_rejected']);
    });
  });

  describe('I1: la sesión solo acepta tokens HS256 de este emisor y audiencia', () => {
    const jwt = new JwtService({ secret: testConfig.jwtSecret });
    const meWith = (token: string) =>
      request(server()).get('/api/auth/me').set('Cookie', `${SESSION_COOKIE}=${token}`);
    const payload = async () => {
      const user = await users.findById(securityId);
      return { sub: securityId, ver: user?.sessionsValidFrom.getTime() };
    };
    const { algorithm, issuer, audience } = SESSION_TOKEN;

    it('acepta un token con algoritmo, emisor y audiencia correctos', async () => {
      const token = await jwt.signAsync(await payload(), { algorithm, issuer, audience });
      await meWith(token).expect(200);
    });

    it.each([
      ['otra audiencia', { algorithm, issuer, audience: 'otra-app' }],
      ['otro emisor', { algorithm, issuer: 'otra-api', audience }],
      ['sin emisor ni audiencia', { algorithm }],
      ['otro algoritmo (HS512)', { algorithm: 'HS512' as const, issuer, audience }],
    ])('rechaza un token firmado con el mismo secreto pero con %s', async (_, options) => {
      const token = await jwt.signAsync(await payload(), options);
      await meWith(token).expect(401);
    });
  });

  describe('SEC-06: errores del cuerpo de la petición', () => {
    it('un cuerpo demasiado grande responde 413, no 500', async () => {
      const response = await request(server())
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ email: 'a'.repeat(300_000), password: 'x' }))
        .expect(413);
      expect(response.body).toEqual({
        code: ErrorCode.PAYLOAD_TOO_LARGE,
        message: 'La petición es demasiado grande.',
      });
    });

    it('un JSON mal formado responde 400', async () => {
      const response = await request(server())
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": ')
        .expect(400);
      expect(response.body.code).toBe(ErrorCode.VALIDATION_ERROR);
    });
  });
});

describe('SEC-07: límite de peticiones a toda la API (HTTP)', () => {
  const API_LIMIT = 5;
  let app: INestApplication;
  let users: InMemoryUsersRepository;

  const server = () => app.getHttpServer();
  const loginAs = async (email: string) =>
    sessionCookieOf(
      await request(server())
        .post('/api/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200),
    );
  const me = (cookie: string) => request(server()).get('/api/auth/me').set('Cookie', cookie);

  beforeAll(async () => {
    users = new InMemoryUsersRepository();
    app = await createTestApp({
      users,
      // El límite de login (2) es menor que el general: si se aplicara a /me, cortaría antes.
      config: { ...testConfig, apiRateLimitPerMinute: API_LIMIT, loginRateLimitPerMinute: 2 },
    });
    const passwordHash = await new PasswordHasher().hash(PASSWORD);
    for (const email of ['caseta1@cedi.test', 'caseta2@cedi.test']) {
      await users.create({ name: 'Guarda', email, passwordHash, role: Role.SECURITY });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('corta a un usuario que supera el límite, sin afectar a otro desde la misma IP', async () => {
    const first = await loginAs('caseta1@cedi.test');
    const second = await loginAs('caseta2@cedi.test');

    for (let i = 0; i < API_LIMIT; i++) await me(first).expect(200);
    const limited = await me(first).expect(429);
    expect(limited.body.code).toBe(ErrorCode.TOO_MANY_REQUESTS);

    await me(second).expect(200);
  });
});
