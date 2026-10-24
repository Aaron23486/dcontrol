import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { loadEnvFile } from '../../src/config/load-env-file';

/**
 * Aplica las migraciones pendientes a la base de pruebas. No la resetea: cada prueba
 * vacía las tablas que usa, así nunca se ejecuta un comando destructivo sobre el esquema.
 */
export default function setup(): void {
  loadEnvFile();
  const url = process.env.DATABASE_URL_TEST;
  if (!url) {
    throw new Error('Define DATABASE_URL_TEST en .env para las pruebas de integración.');
  }
  if (url === process.env.DATABASE_URL || url === process.env.MIGRATION_DATABASE_URL) {
    throw new Error('DATABASE_URL_TEST no puede ser la misma base que la de desarrollo.');
  }
  execSync('npx prisma migrate deploy', {
    cwd: resolve(__dirname, '../..'),
    // Las dos variables: prisma.config.ts prefiere MIGRATION_DATABASE_URL (ADR 0012).
    env: { ...process.env, DATABASE_URL: url, MIGRATION_DATABASE_URL: url },
    stdio: 'inherit',
  });
}
