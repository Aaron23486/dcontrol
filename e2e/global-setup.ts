import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

/** Deja la base de pruebas con los datos que esperan los escenarios. */
export default function globalSetup(): void {
  execSync('npm run e2e:prepare -w @cedi/api', {
    cwd: resolve(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  });
}
