import type { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { SESSION_COOKIE } from '../src/auth/session-cookie';
import { APP_CONFIG, type AppConfig } from '../src/config/app-config';
import { UsersRepository } from '../src/users/users.repository';

export const testConfig: AppConfig = {
  nodeEnv: 'test',
  isProduction: false,
  apiPort: 0,
  databaseUrl: 'postgresql://unused:unused@localhost:5432/unused',
  jwtSecret: 'test-secret-'.padEnd(48, 'x'),
  sessionTtlHours: 12,
  webOrigin: 'http://localhost:5173',
  timezone: 'America/Mexico_City',
  // Alto para que las pruebas no choquen con el límite; el rate limit se prueba aparte.
  loginRateLimitPerMinute: 1000,
  trustProxy: false,
};

interface TestAppOptions {
  config?: AppConfig;
  /** Sustituye el repositorio de usuarios (p. ej. en memoria, para pruebas sin BD). */
  users?: UsersRepository;
  /** Controladores extra solo para la prueba. */
  controllers?: Type[];
  /** Otros proveedores a sustituir (p. ej. el reloj). */
  overrides?: { provide: unknown; useValue: unknown }[];
}

/** La app completa, configurada igual que en `main.ts`. */
export async function createTestApp({
  config = testConfig,
  users,
  controllers = [],
  overrides = [],
}: TestAppOptions = {}): Promise<INestApplication> {
  let builder = Test.createTestingModule({ imports: [AppModule], controllers })
    .overrideProvider(APP_CONFIG)
    .useValue(config);
  if (users) builder = builder.overrideProvider(UsersRepository).useValue(users);
  for (const { provide, useValue } of overrides) {
    builder = builder.overrideProvider(provide).useValue(useValue);
  }
  const app = (await builder.compile()).createNestApplication();
  configureApp(app, config);
  await app.init();
  return app;
}

/** Extrae `cedi_session=<token>` de una respuesta de login, listo para el header Cookie. */
export function sessionCookieOf(response: Response): string {
  const cookies = response.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = cookies?.find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) throw new Error('La respuesta no trae cookie de sesión');
  return cookie.split(';')[0] as string;
}

/** Reloj controlado por la prueba (D2, D3). */
export class FakeClock {
  constructor(private current = new Date('2026-10-23T15:00:00Z')) {}

  now(): Date {
    return new Date(this.current);
  }

  set(instant: string | Date): void {
    this.current = new Date(instant);
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}
