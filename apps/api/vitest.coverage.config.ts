import { defineConfig, mergeConfig } from 'vitest/config';
import integration from './vitest.integration.config';

// Cobertura de la API: unitarias + integración (los repositorios solo corren contra la BD real).
export default mergeConfig(
  integration,
  defineConfig({
    test: {
      include: ['src/**/*.spec.ts', 'test/**/*.spec.ts', 'test/integration/**/*.int-spec.ts'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.ts'],
        exclude: ['src/**/*.spec.ts', 'src/generated/**', 'src/main.ts'],
        reporter: ['text-summary', 'html'],
        // Por debajo de lo actual (≈97 % líneas, ≈86 % ramas): impide retrocesos sin notarlo.
        thresholds: { lines: 90, branches: 80 },
      },
    },
  }),
);
