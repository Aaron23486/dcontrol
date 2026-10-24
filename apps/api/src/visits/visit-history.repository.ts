import { Injectable } from '@nestjs/common';
import { Page, PersonType, VisitDetail, VisitListItem, VisitStatusFilter } from '@cedi/shared';
import type { Prisma } from '../generated/prisma/client';
import type { SearchTerms } from '../persons/person-search';
import { PrismaService } from '../prisma/prisma.service';
import { VISIT_INCLUDE, toVisitSummary } from './visit.mapper';

/** Filtro del historial, ya traducido por el servicio (fechas a instantes, texto normalizado). */
export interface VisitHistoryFilter {
  type: PersonType;
  /** Entradas desde este instante (inclusive). */
  entryFrom?: Date;
  /** Entradas antes de este instante (exclusivo). */
  entryBefore?: Date;
  status?: VisitStatusFilter;
  search?: SearchTerms;
  page: number;
  pageSize: number;
}

/** Lecturas del historial de visitas (spec §16). */
export abstract class VisitHistoryRepository {
  abstract findPage(filter: VisitHistoryFilter): Promise<Page<VisitListItem>>;
  abstract findDetail(visitId: string): Promise<VisitDetail | null>;
}

const PERSON = { select: { id: true, fullName: true, identification: true } } as const;
const USER = { select: { id: true, name: true } } as const;

@Injectable()
export class PrismaVisitHistoryRepository extends VisitHistoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findPage(filter: VisitHistoryFilter): Promise<Page<VisitListItem>> {
    const where = whereOf(filter);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.visit.count({ where }),
      this.prisma.visit.findMany({
        where,
        include: { ...VISIT_INCLUDE, person: PERSON },
        orderBy: [{ entryAt: 'desc' }, { id: 'desc' }],
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
    ]);
    return {
      items: rows.map((row) => ({ ...toVisitSummary(row), person: row.person })),
      total,
      page: filter.page,
      pageSize: filter.pageSize,
    };
  }

  async findDetail(visitId: string): Promise<VisitDetail | null> {
    const row = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: { ...VISIT_INCLUDE, person: PERSON, entryBy: USER, exitBy: USER },
    });
    return row
      ? { ...toVisitSummary(row), person: row.person, entryBy: row.entryBy, exitBy: row.exitBy }
      : null;
  }
}

/**
 * El tipo y la empresa son los de la visita (R17): si alguien cambió de empresa,
 * sus visitas anteriores se siguen encontrando por la empresa de entonces.
 */
function whereOf({ type, entryFrom, entryBefore, status, search }: VisitHistoryFilter) {
  const where: Prisma.VisitWhereInput = { personType: type };
  if (entryFrom || entryBefore) where.entryAt = { gte: entryFrom, lt: entryBefore };
  if (status === VisitStatusFilter.INSIDE) where.exitAt = null;
  if (status === VisitStatusFilter.EXITED) where.exitAt = { not: null };
  if (search) {
    where.OR = [
      { person: { nameNormalized: { contains: search.name } } },
      { company: { nameNormalized: { contains: search.company } } },
      ...(search.identificationPrefix
        ? [{ person: { identification: { startsWith: search.identificationPrefix } } }]
        : []),
    ];
  }
  return where;
}
