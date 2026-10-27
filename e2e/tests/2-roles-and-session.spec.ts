import { expect, test } from '@playwright/test';
import { login } from './support';

test('Seguridad no ve ni puede abrir la auditoría (NFR-8, D12)', async ({ page }) => {
  await login(page, 'guard');

  const nav = page.getByRole('navigation', { name: 'Principal' });
  await expect(nav.getByRole('link', { name: 'Historial' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Auditoría' })).toHaveCount(0);

  await page.goto('/auditoria');
  await expect(page.getByText('No tienes permiso para ver esta sección.')).toBeVisible();
});

test('el Administrador consulta la auditoría de lo registrado en la caseta', async ({ page }) => {
  await login(page, 'admin');
  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: 'Auditoría' })
    .click();

  await expect(page.getByRole('heading', { name: 'Auditoría' })).toBeVisible();
  const table = page.getByRole('table');
  await expect(table.getByText('Registró entrada').first()).toBeVisible();
  await expect(table.getByText('Cerró visita sin salida')).toBeVisible();
  await expect(table.getByText('Guarda E2E').first()).toBeVisible();
});

test('cerrar sesión vuelve al login y no deja ver los datos cargados', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('/auditoria');
  await expect(page.getByRole('table')).toBeVisible();

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('si la sesión vence a mitad del turno, vuelve al login con un aviso claro', async ({
  page,
  context,
}) => {
  await login(page, 'guard');
  // Simula el vencimiento: el navegador pierde la cookie de sesión.
  await context.clearCookies();
  await page.getByRole('link', { name: 'Historial' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('status')).toHaveText(
    'Tu sesión terminó. Inicia sesión de nuevo para continuar.',
  );
});

test('una dirección que no existe muestra «Página no encontrada»', async ({ page }) => {
  await login(page, 'guard');
  await page.goto('/no-existe');
  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
  await page.getByRole('link', { name: 'Volver a ingreso y salida' }).click();
  await expect(page.getByPlaceholder('Escribe la cédula y pulsa Enter')).toBeVisible();
});
