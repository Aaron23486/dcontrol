import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC conserva la metadata de decoradores que NestJS necesita para la inyección de dependencias.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    environment: 'node',
  },
});
