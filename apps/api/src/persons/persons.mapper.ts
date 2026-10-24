import { PersonDetail, PersonSummary } from '@cedi/shared';
import type { Prisma } from '../generated/prisma/client';
import { COMPANY_SELECT as COMPANY, VISIT_INCLUDE, toVisitSummary } from '../visits/visit.mapper';

/** Lo necesario para una fila de la lista: empresa y última visita (R1: la abierta es la última). */
export const SUMMARY_INCLUDE = {
  company: COMPANY,
  visits: {
    orderBy: { entryAt: 'desc' },
    take: 1,
    select: {
      entryAt: true,
      exitAt: true,
      purpose: true,
      area: true,
      _count: { select: { tools: true } },
    },
  },
} as const satisfies Prisma.PersonInclude;

export const DETAIL_INCLUDE = (visitsLimit: number) =>
  ({
    company: COMPANY,
    visits: {
      orderBy: { entryAt: 'desc' },
      take: visitsLimit,
      include: VISIT_INCLUDE,
    },
  }) as const satisfies Prisma.PersonInclude;

export type SummaryRow = Prisma.PersonGetPayload<{ include: typeof SUMMARY_INCLUDE }>;
type DetailRow = Prisma.PersonGetPayload<{ include: ReturnType<typeof DETAIL_INCLUDE> }>;

export function toPersonSummary(row: SummaryRow): PersonSummary {
  const [last] = row.visits;
  return {
    id: row.id,
    fullName: row.fullName,
    identification: row.identification,
    type: row.type,
    company: row.company,
    isInside: last !== undefined && last.exitAt === null,
    lastVisit: last
      ? {
          entryAt: last.entryAt.toISOString(),
          exitAt: last.exitAt?.toISOString() ?? null,
          purpose: last.purpose,
          area: last.area,
          toolsCount: last._count.tools,
        }
      : null,
  };
}

export function toPersonDetail(row: DetailRow): PersonDetail {
  const visits = row.visits.map(toVisitSummary);
  const [last] = visits;
  return {
    id: row.id,
    fullName: row.fullName,
    identification: row.identification,
    type: row.type,
    company: row.company,
    createdAt: row.createdAt.toISOString(),
    isInside: last !== undefined && last.exitAt === null,
    lastVisit: last
      ? {
          entryAt: last.entryAt,
          exitAt: last.exitAt,
          purpose: last.purpose,
          area: last.area,
          toolsCount: last.tools.length,
        }
      : null,
    visits,
  };
}
