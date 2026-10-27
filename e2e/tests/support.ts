import { expect, type Page } from '@playwright/test';

export const ACCOUNTS = {
  guard: { email: 'guarda.e2e@cedi.test', name: 'Guarda E2E' },
  admin: { email: 'admin.e2e@cedi.test', name: 'Admin E2E' },
} as const;

export async function login(page: Page, who: keyof typeof ACCOUNTS): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(ACCOUNTS[who].email);
  await page.getByLabel('Contraseña').fill(process.env.E2E_PASSWORD ?? '');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  // El nombre del usuario se oculta en pantallas angostas; el botón de salir siempre está.
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
}

/** Campo principal de la caseta: escribe la cédula y pulsa Enter, como un lector tipo teclado. */
export async function enterIdentification(page: Page, identification: string): Promise<void> {
  const field = page.getByPlaceholder('Escribe la cédula y pulsa Enter');
  await expect(field).toBeFocused();
  await field.fill(identification);
  await field.press('Enter');
}

export const banner = (page: Page) => page.getByRole('status');

/** AAAA-MM-DD de ayer en la zona de las pruebas (la que usan la API y el navegador). */
export function yesterdayInCedi(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: process.env.CEDI_TIMEZONE }).format(
    yesterday,
  );
}
