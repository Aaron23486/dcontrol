import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Pruebas e2e del flujo de la caseta (docs/architecture.md: «Tested rules»).
 * Levantan su propia API (:3100) y web (:5174) contra la base de pruebas, así no interfieren
 * con el servidor de desarrollo (:3000 / :5173) ni con sus datos.
 */
const repoRoot = resolve(__dirname, '..');
const envFile = resolve(repoRoot, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const API_PORT = 3100;
const WEB_PORT = 5174;
/**
 * Zona horaria de las pruebas: una zona fija (Etc/GMT±N) en la que ahora es mediodía.
 * Los escenarios crean datos «hace unos minutos» y los comparan con «hoy»; con la zona real del
 * CEDI fallaban si las pruebas corrían justo después de medianoche (los datos caían en el día
 * anterior). Se calcula una vez y los workers la heredan, así todos usan la misma.
 * `E2E_TIMEZONE` permite forzar otra (p. ej. para reproducir el caso de medianoche).
 */
function middayTimeZone(now = new Date()): string {
  const offset = 12 - now.getUTCHours(); // de -11 a +12 horas respecto de UTC
  if (offset === 0) return 'Etc/GMT';
  // En las zonas Etc/GMT el signo va invertido: Etc/GMT-3 es UTC+3.
  return offset > 0 ? `Etc/GMT-${offset}` : `Etc/GMT+${-offset}`;
}
process.env.E2E_TIMEZONE ??= middayTimeZone();
const TIMEZONE = process.env.E2E_TIMEZONE;
// Contraseña de las cuentas e2e: solo existen en la base de pruebas, que se vacía al terminar.
process.env.E2E_PASSWORD ??= 'contraseña-e2e-1234';
process.env.CEDI_TIMEZONE = TIMEZONE;

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl) throw new Error('Define DATABASE_URL_TEST para las pruebas e2e.');

/**
 * La API de las pruebas se conecta con un usuario sin privilegios, como en producción
 * (SEC-02, ADR 0012): si a una migración le falta un GRANT, los escenarios fallan.
 * e2e:prepare lo crea antes de las pruebas y le quita el inicio de sesión al terminar.
 */
const appDatabaseUrl = new URL(databaseUrl);
appDatabaseUrl.username = 'cedi_e2e_app';
appDatabaseUrl.password = encodeURIComponent(process.env.E2E_PASSWORD);
process.env.E2E_APP_DATABASE_URL = appDatabaseUrl.toString();

export default defineConfig({
  testDir: './tests',
  // Los escenarios comparten la base preparada: se ejecutan en orden, uno a la vez.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    locale: 'es-MX',
    timezoneId: TIMEZONE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Por defecto, el Chromium de Playwright (`npx playwright install chromium`). Con
  // E2E_BROWSER_CHANNEL=chrome (o msedge) se usa el navegador ya instalado en el equipo.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env.E2E_BROWSER_CHANNEL ?? 'chromium' },
    },
  ],
  webServer: [
    {
      command:
        'npm run build -w @cedi/shared && npm run build -w @cedi/api && node apps/api/dist/main.js',
      cwd: repoRoot,
      url: `http://localhost:${API_PORT}/api/auth/me`,
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        API_PORT: String(API_PORT),
        DATABASE_URL: process.env.E2E_APP_DATABASE_URL,
        WEB_ORIGIN: `http://localhost:${WEB_PORT}`,
        CEDI_TIMEZONE: TIMEZONE,
        LOGIN_RATE_LIMIT_PER_MINUTE: '1000',
      } as Record<string, string>,
    },
    {
      command: `npm run dev -w @cedi/web -- --port ${WEB_PORT} --strictPort`,
      cwd: repoRoot,
      url: `http://localhost:${WEB_PORT}`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: { ...process.env, API_PORT: String(API_PORT) } as Record<string, string>,
    },
  ],
});
