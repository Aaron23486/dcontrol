import { defineConfig } from 'prisma/config';
import { loadEnvFile } from './src/config/load-env-file';

loadEnvFile();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Las migraciones las aplica el dueño de las tablas, no el usuario de la API (ADR 0012).
    // `prisma generate` no necesita conexión; migrate falla con un mensaje claro si falta.
    url: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL ?? '',
  },
});
