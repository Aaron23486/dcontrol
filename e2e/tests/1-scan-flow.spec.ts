import { expect, test } from '@playwright/test';
import { banner, enterIdentification, login, yesterdayInCedi } from './support';

// Escenarios del flujo de la caseta, en orden: comparten la base preparada (global-setup).
test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await login(page, 'guard');
});

test('cédula nueva: registra a la persona y su primera entrada (spec §10)', async ({ page }) => {
  await enterIdentification(page, 'e2e-nueva-1');

  await expect(page.getByRole('heading', { name: 'Cédula no registrada' })).toBeVisible();
  await expect(page.getByLabel('Cédula', { exact: true }).last()).toHaveValue('E2ENUEVA1');
  await page.getByLabel('Nombre completo').fill('Nora Nueva');
  await page.getByLabel('Tipo de persona').selectOption('VISITOR');
  await page.getByRole('combobox', { name: 'Empresa' }).fill('acme');
  await page.getByRole('option', { name: 'Acme Logística' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Visitante: motivo y área que visita (spec §7).
  await page.getByLabel('Motivo').fill('Entrevista');
  await page.getByLabel('Área que visita').fill('Recursos humanos');
  await page.getByRole('button', { name: 'Registrar persona y entrada' }).click();

  await expect(banner(page)).toContainText('ENTRADA registrada');
  await expect(banner(page)).toContainText('Nora Nueva');
  await expect(page.getByRole('table').getByText('Nora Nueva')).toBeVisible();
});

test('doble escaneo: pide confirmación y, confirmado, registra la salida (D2)', async ({
  page,
}) => {
  await enterIdentification(page, 'E2ENUEVA1');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('¿Registrar la SALIDA?');
  // Un Enter accidental no confirma: el foco empieza en «Cancelar».
  await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Sí, salida' }).click();

  await expect(banner(page)).toContainText('SALIDA registrada');
  await expect(banner(page)).toContainText('Nora Nueva');
});

test('persona registrada: prellena motivo y área de su visita anterior (D1)', async ({ page }) => {
  await enterIdentification(page, 'E2E-0001');

  // La ficha de la persona (su nombre también aparece en las listas del dashboard).
  await expect(page.getByText(/Cédula E2E0001/)).toBeVisible();
  await expect(page.getByLabel('Motivo')).toHaveValue('Pintura de andén');
  await expect(page.getByLabel('Área', { exact: true })).toHaveValue('Andén 4');
  await page.getByLabel('Motivo').press('Enter');

  await expect(banner(page)).toContainText('ENTRADA registrada');
  await expect(banner(page)).toContainText('Rosa Prellenado');
});

test('técnico: la salida muestra las herramientas a revisar (Fase 7)', async ({ page }) => {
  await enterIdentification(page, 'E2E0002');

  await expect(banner(page)).toContainText('SALIDA registrada');
  await expect(banner(page)).toContainText('Verifica que salga con las herramientas que ingresó');
  await expect(banner(page)).toContainText('Taladro ×2');
  await expect(banner(page)).toContainText('Multímetro');
});

test('visita olvidada: se cierra con la hora real y se registra la nueva entrada (D3)', async ({
  page,
}) => {
  await enterIdentification(page, 'E2E0003');

  await expect(page.getByText(/Tiene una visita abierta desde/)).toBeVisible();
  await page.getByLabel('Hora real en que salió esa vez').fill(`${yesterdayInCedi()}T18:00`);
  await page.getByRole('button', { name: 'Cerrar esa visita y registrar nueva entrada' }).click();

  // Tras cerrar la visita olvidada se ofrece la nueva entrada, prellenada (D1).
  await expect(page.getByLabel('Motivo')).toHaveValue('Reunión');
  await page.getByRole('button', { name: 'Registrar entrada' }).click();

  await expect(banner(page)).toContainText('ENTRADA registrada');
  await expect(banner(page)).toContainText('Olga Olvidada');
});

test('el historial muestra las visitas de hoy con sus datos (spec §16)', async ({ page }) => {
  await page.getByRole('link', { name: 'Historial' }).click();
  await page.getByRole('link', { name: 'Visitantes' }).click();

  const table = page.getByRole('table');
  await expect(table.getByText('Nora Nueva')).toBeVisible();
  await expect(table.getByText('Entrevista')).toBeVisible();
  await expect(table.getByText('Olga Olvidada')).toBeVisible();
});
