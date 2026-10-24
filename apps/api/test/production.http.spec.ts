import type { INestApplication } from '@nestjs/common';
import { ErrorCode } from '@cedi/shared';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InMemoryUsersRepository } from './in-memory-users.repository';
import { createTestApp, testConfig } from './test-app';

/** La API sirve la web compilada en producción (ADR 0010). */
describe('Producción: la API sirve la web', () => {
  let app: INestApplication;
  let webDir: string;

  beforeAll(async () => {
    webDir = mkdtempSync(join(tmpdir(), 'cedi-web-'));
    mkdirSync(join(webDir, 'assets'));
    writeFileSync(join(webDir, 'index.html'), '<!doctype html><title>CEDI Control</title>');
    writeFileSync(join(webDir, 'assets', 'app-abc123.js'), 'console.log("app")');
    app = await createTestApp({
      users: new InMemoryUsersRepository(),
      config: {
        ...testConfig,
        // Comportamiento de producción sin sus logs (`nodeEnv: 'test'` los silencia).
        isProduction: true,
        webDistDir: webDir,
        // Base inalcanzable a propósito: prueba el 503 del chequeo de salud.
        databaseUrl: 'postgresql://nadie:nada@127.0.0.1:1/ninguna',
      },
    });
  });

  afterAll(async () => {
    await app.close();
    rmSync(webDir, { recursive: true, force: true });
  });

  it('devuelve la web en la raíz y en cualquier ruta de la SPA, sin caché', async () => {
    for (const path of ['/', '/historial/contratistas', '/personas/detalle/123']) {
      const response = await request(app.getHttpServer()).get(path).expect(200);
      expect(response.text).toContain('<title>CEDI Control</title>');
      expect(response.headers['cache-control']).toBe('no-cache');
    }
  });

  it('los archivos con hash se guardan en caché un año', async () => {
    const response = await request(app.getHttpServer()).get('/assets/app-abc123.js').expect(200);
    expect(response.headers['cache-control']).toContain('immutable');
  });

  it('las rutas /api siguen siendo de la API, también las inexistentes', async () => {
    // Una ruta /api inexistente responde el error JSON de la API, nunca la web.
    const response = await request(app.getHttpServer()).get('/api/no-existe').expect(404);
    expect(response.body).toEqual({ code: ErrorCode.NOT_FOUND, message: 'El recurso no existe.' });
  });

  it('el chequeo de salud responde 503 si la base de datos no contesta', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(503);
    expect(response.body).toEqual({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'La base de datos no responde.',
    });
  });

  it('envía cabeceras de seguridad (helmet)', async () => {
    const response = await request(app.getHttpServer()).get('/');
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('falla al arrancar si WEB_DIST_DIR no tiene la web compilada', async () => {
    await expect(
      createTestApp({
        users: new InMemoryUsersRepository(),
        config: { ...testConfig, webDistDir: join(webDir, 'no-existe') },
      }),
    ).rejects.toThrow(/WEB_DIST_DIR/);
  });
});
