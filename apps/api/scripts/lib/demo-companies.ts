import { normalizeCompanyName } from '@cedi/shared';
import type { PrismaService } from '../../src/prisma/prisma.service';

/** Empresas ficticias que usan `npm run db:seed` y `npm run demo:setup`. */
export const DEMO_COMPANIES = [
  'Transportes del Norte S.A.',
  'Servicios Industriales Rivera',
  'Mantenimiento Integral MX',
  'Limpieza Total',
  // Para visitantes que no vienen en nombre de una empresa (la empresa es obligatoria, D9).
  'Particular',
] as const;

export type DemoCompany = (typeof DEMO_COMPANIES)[number];

/** Crea las empresas que falten. Solo inserta (sin UPDATE): la API no puede modificar empresas (ADR 0012). */
export async function ensureDemoCompanies(prisma: PrismaService): Promise<void> {
  await prisma.company.createMany({
    data: DEMO_COMPANIES.map((name) => ({ name, nameNormalized: normalizeCompanyName(name) })),
    skipDuplicates: true,
  });
}
