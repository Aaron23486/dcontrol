import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

/** Vacía la base de pruebas: datos sobrantes podrían hacer fallar una migración futura. */
export default function globalTeardown(): void {
  execSync('npm run e2e:prepare -w @cedi/api -- --clean', {
    cwd: resolve(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  });
}
