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
    // `prisma generate` no necesita conexión; migrate y seed fallan con un mensaje claro si falta.
    url: process.env.DATABASE_URL ?? '',
  },
});
