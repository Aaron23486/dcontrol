import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Pruebas contra PostgreSQL real (DATABASE_URL_TEST). Requieren `npm run db:up`.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['test/integration/**/*.int-spec.ts'],
    environment: 'node',
    globalSetup: ['test/integration/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
