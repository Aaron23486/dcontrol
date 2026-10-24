import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Carga el `.env` de la raíz del repositorio si existe. En producción las variables
 * llegan del entorno y el archivo no está presente. Las variables ya definidas no se pisan.
 */
export function loadEnvFile(): void {
  const path = resolve(__dirname, '../../../../.env');
  if (existsSync(path)) {
    config({ path, quiet: true });
  }
}
