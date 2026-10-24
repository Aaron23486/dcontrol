import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      // La web consume el código fuente de @cedi/shared (ESM) y la API su build (CommonJS).
      alias: {
        '@cedi/shared': fileURLToPath(
          new URL('../../packages/shared/src/index.ts', import.meta.url),
        ),
      },
    },
    server: {
      port: 5173,
      // Mismo origen en desarrollo: la cookie SameSite=Strict funciona sin CORS.
      proxy: { '/api': `http://localhost:${env.API_PORT ?? '3000'}` },
    },
    test: {
      // Solo lógica de la web; la interfaz se prueba de punta a punta con Playwright (e2e/).
      include: ['src/**/*.test.ts'],
      // Cobertura de la lógica (.ts); los componentes (.tsx) los cubren las pruebas e2e.
      coverage: {
        provider: 'v8',
        include: ['src/**/*.ts'],
        exclude: ['src/**/*.test.ts', 'src/**/*.api.ts', 'src/**/use-*.ts'],
        reporter: ['text-summary', 'html'],
        thresholds: { lines: 85, branches: 85 },
      },
    },
  };
});
