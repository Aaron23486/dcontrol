import { expect, test, type Page } from '@playwright/test';
import { login } from './support';

/** La página no se desborda a lo ancho y los controles miden al menos 40 px (spec §27-28). */
async function expectFitsAndTouchable(page: Page, screen: string): Promise<void> {
  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    small: [...document.querySelectorAll('button, input, select, a.inline-flex')]
      .filter((element) => (element as HTMLElement).offsetParent !== null)
      .filter((element) => element.getBoundingClientRect().height < 40)
      .map((element) => element.textContent?.trim() || element.tagName),
  }));
  expect(layout.overflow, `«${screen}» se desborda a lo ancho`).toBe(false);
  expect(layout.small, `controles de menos de 40 px en «${screen}»`).toEqual([]);
}

test.describe('tablet (768 × 1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('las pantallas caben y sus controles se pueden tocar', async ({ page }) => {
    await login(page, 'admin');
    for (const [path, screen] of [
      ['/', 'ingreso y salida'],
      ['/dentro', 'dentro'],
      ['/historial/mantenimiento?range=all', 'historial'],
      ['/personas/contratistas', 'personas'],
      ['/auditoria', 'auditoría'],
    ] as const) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expectFitsAndTouchable(page, screen);
    }
    await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeInViewport();
  });
});

test('teclado: «Saltar al contenido» es lo primero y lleva al contenido', async ({ page }) => {
  await login(page, 'guard');
  await page.goto('/historial');
  // Esperar a que la pantalla esté lista: mientras se verifica la sesión no hay nada enfocable.
  await expect(page.getByRole('heading', { name: 'Historial de visitas' })).toBeVisible();
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Saltar al contenido' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#contenido')).toBeFocused();
});

test('cada pantalla tiene su propio título de pestaña', async ({ page }) => {
  await login(page, 'guard');
  await expect(page).toHaveTitle('Ingreso y salida · CEDI Control');
  await page.getByRole('link', { name: 'Historial' }).click();
  await expect(page).toHaveTitle('Historial · CEDI Control');
});
