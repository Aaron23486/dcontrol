import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { AppConfig } from './config/app-config';

/** Configuración HTTP compartida por `main.ts` y las pruebas. */
export function configureApp(app: INestApplication, config: AppConfig): void {
  const server = app.getHttpAdapter().getInstance() as Express;
  // Detrás de un proxy con HTTPS: IP real del cliente (rate limit) y cookie Secure (ADR 0010).
  if (config.trustProxy) server.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.use(
    helmet({
      contentSecurityPolicy: {
        // I3: la web compilada solo usa hojas de estilo y fuentes propias, sin estilos en línea.
        directives: { 'style-src': ["'self'"], 'font-src': ["'self'"] },
      },
    }),
  );
  app.use(cookieParser());
  app.enableCors({ origin: config.webOrigin, credentials: true });
  if (config.webDistDir) serveWeb(server, resolve(config.webDistDir));
}

/**
 * En producción la API sirve también la web compilada: mismo origen para la cookie de sesión
 * (ADR 0004, 0010). `/api/*` sigue siendo de la API; cualquier otra ruta devuelve la SPA.
 */
function serveWeb(server: Express, dir: string): void {
  const index = join(dir, 'index.html');
  if (!existsSync(index)) {
    throw new Error(`WEB_DIST_DIR no contiene la web compilada: falta ${index}`);
  }
  // Los archivos de /assets llevan hash en el nombre: se pueden guardar en caché un año.
  server.use('/assets', express.static(join(dir, 'assets'), { immutable: true, maxAge: '1y' }));
  server.use(express.static(dir, { index: false }));
  server.get(/^(?!\/api(\/|$)).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(index);
  });
}
