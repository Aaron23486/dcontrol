import { VisitSummary } from '@cedi/shared';
import type { Prisma } from '../generated/prisma/client';

export const COMPANY_SELECT = { select: { id: true, name: true } } as const;

/** Todo lo que muestra una visita: empresa y herramientas de ese momento (R17). */
export const VISIT_INCLUDE = {
  company: COMPANY_SELECT,
  tools: {
    select: { name: true, description: true, quantity: true },
    orderBy: { name: 'asc' },
  },
} as const satisfies Prisma.VisitInclude;

type VisitRow = Prisma.VisitGetPayload<{ include: typeof VISIT_INCLUDE }>;

export function toVisitSummary(visit: VisitRow): VisitSummary {
  return {
    id: visit.id,
    personType: visit.personType,
    company: visit.company,
    entryAt: visit.entryAt.toISOString(),
    exitAt: visit.exitAt?.toISOString() ?? null,
    purpose: visit.purpose,
    area: visit.area,
    tools: visit.tools,
  };
}
