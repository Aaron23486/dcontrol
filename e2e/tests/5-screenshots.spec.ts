import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { banner, enterIdentification, login } from './support';

/**
 * Capturas del README (`npm run screenshots`). Corre al final, sobre los datos que dejaron
 * los escenarios anteriores; con `npm run test:e2e` se omite.
 */
test.skip(!process.env.SCREENSHOTS, 'Solo con npm run screenshots');
test.use({ viewport: { width: 1280, height: 800 } });

const shot = (name: string) => resolve(__dirname, '../../docs/screenshots', `${name}.png`);

test('capturas de las pantallas principales', async ({ page }) => {
  await page.goto('/login');
  await page.screenshot({ path: shot('01-login') });

  await login(page, 'guard');
  await enterIdentification(page, 'E2E-NUEVA-2');
  await expect(page.getByRole('heading', { name: 'Cédula no registrada' })).toBeVisible();
  await page.getByLabel('Nombre completo').fill('Iván Técnico');
  await page.getByLabel('Tipo de persona').selectOption('MAINTENANCE_TECHNICIAN');
  await page.getByRole('combobox', { name: 'Empresa' }).fill('acme');
  await page.getByRole('option', { name: 'Acme Logística' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Motivo').fill('Mantenimiento de montacargas');
  await page.getByLabel('Área', { exact: true }).fill('Taller');
  await page.getByRole('button', { name: 'Agregar herramienta' }).click();
  await page.getByLabel('Herramienta 1', { exact: true }).fill('Llave de impacto');
  await page.getByLabel('Cantidad de la herramienta 1').fill('1');
  await page.screenshot({ path: shot('03-persona-nueva-tecnico') });
  await page.getByRole('button', { name: 'Registrar persona y entrada' }).click();
  await expect(banner(page)).toContainText('ENTRADA registrada');
  await page.screenshot({ path: shot('02-ingreso-y-salida') });

  await page.goto('/dentro');
  await expect(page.getByRole('table')).toBeVisible();
  await page.screenshot({ path: shot('04-personas-dentro') });

  await page.goto('/historial/contratistas?range=all');
  await expect(page.getByRole('table')).toBeVisible();
  await page.screenshot({ path: shot('05-historial') });

  await page.goto('/personas/mantenimiento');
  await expect(page.getByRole('table')).toBeVisible();
  await page.screenshot({ path: shot('06-personas-por-tipo') });

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await login(page, 'admin');
  await page.goto('/auditoria');
  await expect(page.getByRole('table')).toBeVisible();
  await page.screenshot({ path: shot('07-auditoria') });
});
