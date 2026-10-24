import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { enterIdentification, login } from './support';

/** Revisión automática WCAG 2.1 A/AA de la pantalla actual (spec §28). */
async function expectAccessible(page: Page, screen: string): Promise<void> {
  const { violations, passes } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  // Evita un falso «sin problemas»: axe debe haber evaluado reglas reales, incluido el contraste.
  expect(passes.map((rule) => rule.id)).toContain('color-contrast');
  expect(passes.length).toBeGreaterThan(10);
  const summary = violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help} → ${violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(' '))
        .join(' | ')}`,
  );
  expect(summary, `Problemas de accesibilidad en «${screen}»`).toEqual([]);
}

test('login', async ({ page }) => {
  await page.goto('/login');
  await expectAccessible(page, 'login');
});

test('pantallas principales como Administrador', async ({ page }) => {
  await login(page, 'admin');
  const screens: [string, string][] = [
    ['/', 'ingreso y salida'],
    ['/dentro', 'dentro'],
    ['/historial/contratistas?range=all', 'historial'],
    ['/personas/visitantes', 'personas'],
    ['/personas/visitantes/nueva', 'registrar persona'],
    ['/auditoria', 'auditoría'],
  ];
  for (const [path, screen] of screens) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expectAccessible(page, screen);
  }

  await page.goto('/personas/visitantes');
  await page.getByRole('table').getByRole('link').first().click();
  await page.waitForLoadState('networkidle');
  await expectAccessible(page, 'ficha de persona');

  await page.goto('/historial/visitantes?range=all');
  await page
    .getByRole('link', { name: /Ver detalle de la visita/ })
    .first()
    .click();
  await page.waitForLoadState('networkidle');
  await expectAccessible(page, 'detalle de visita');
});

test('pasos del escaneo: persona nueva y confirmación', async ({ page }) => {
  await login(page, 'guard');
  await enterIdentification(page, 'E2E-A11Y-1');
  await expect(page.getByRole('heading', { name: 'Cédula no registrada' })).toBeVisible();
  await expectAccessible(page, 'cédula no registrada');
  await page.getByRole('button', { name: 'Cancelar' }).click();

  // Nora Nueva salió hace menos de un minuto en 1-scan-flow: aparece la confirmación (D2).
  await enterIdentification(page, 'E2ENUEVA1');
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible()) {
    await expectAccessible(page, 'confirmación de doble escaneo');
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
  } else {
    await expectAccessible(page, 'entrada pendiente');
  }
});
