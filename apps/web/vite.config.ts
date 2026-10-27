import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vitest/config';

const envFile = fileURLToPath(new URL('../../.env', import.meta.url));

/**
 * Puerto de la API para el proxy de desarrollo, leído del `.env` de la raíz. No se usa `loadEnv`
 * de Vite: tomaría también `NODE_ENV=development` de ese archivo y compilaría React en modo
 * desarrollo incluso en `vite build`.
 */
function apiPort(): string {
  const fromFile = existsSync(envFile)
    ? parseEnv(readFileSync(envFile, 'utf8')).API_PORT
    : undefined;
  return process.env.API_PORT ?? fromFile ?? '3000';
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // La web consume el código fuente de @cedi/shared (ESM) y la API su build (CommonJS).
    alias: {
      '@cedi/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Librerías en archivos propios: cambian poco, así el navegador las conserva en caché
        // entre versiones, y ningún archivo supera el límite de tamaño recomendado.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
              priority: 3,
            },
            { name: 'query', test: /node_modules[\\/]@tanstack[\\/]/, priority: 2 },
            {
              name: 'forms',
              test: /node_modules[\\/](zod|react-hook-form|@hookform)[\\/]/,
              priority: 1,
            },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    // Mismo origen en desarrollo: la cookie SameSite=Strict funciona sin CORS.
    proxy: { '/api': `http://localhost:${apiPort()}` },
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
});
