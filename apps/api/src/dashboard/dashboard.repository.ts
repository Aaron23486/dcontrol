import { Injectable } from '@nestjs/common';
import { ActivityItem, InsideVisit } from '@cedi/shared';
import { PrismaService } from '../prisma/prisma.service';
import { COMPANY_SELECT } from '../visits/visit.mapper';

export interface DayCounts {
  insideCount: number;
  entriesToday: number;
  exitsToday: number;
  forgottenCount: number;
}

/** Lecturas para el dashboard y «Personas dentro». Todo se calcula desde `visits` (D5). */
export abstract class DashboardRepository {
  abstract countDay(startOfToday: Date): Promise<DayCounts>;
  /** Visitas abiertas: primero las de días anteriores (D3), luego por hora de entrada. */
  abstract findInside(startOfToday: Date): Promise<InsideVisit[]>;
  abstract findRecentActivity(limit: number): Promise<ActivityItem[]>;
}

const VISIT_WITH_PERSON = {
  id: true,
  personType: true,
  entryAt: true,
  exitAt: true,
  purpose: true,
  area: true,
  company: COMPANY_SELECT,
  person: { select: { id: true, fullName: true, identification: true } },
} as const;

@Injectable()
export class PrismaDashboardRepository extends DashboardRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async countDay(startOfToday: Date): Promise<DayCounts> {
    const [insideCount, entriesToday, exitsToday, forgottenCount] = await this.prisma.$transaction([
      this.prisma.visit.count({ where: { exitAt: null } }),
      this.prisma.visit.count({ where: { entryAt: { gte: startOfToday } } }),
      this.prisma.visit.count({ where: { exitAt: { gte: startOfToday } } }),
      this.prisma.visit.count({ where: { exitAt: null, entryAt: { lt: startOfToday } } }),
    ]);
    return { insideCount, entriesToday, exitsToday, forgottenCount };
  }

  async findInside(startOfToday: Date): Promise<InsideVisit[]> {
    const visits = await this.prisma.visit.findMany({
      where: { exitAt: null },
      orderBy: { entryAt: 'asc' },
      select: VISIT_WITH_PERSON,
    });
    // Orden por hora de entrada: las visitas de días anteriores quedan primero de forma natural.
    return visits.map((visit) => ({
      visitId: visit.id,
      person: visit.person,
      personType: visit.personType,
      company: visit.company,
      entryAt: visit.entryAt.toISOString(),
      purpose: visit.purpose,
      area: visit.area,
      isFromPreviousDay: visit.entryAt < startOfToday,
    }));
  }

  async findRecentActivity(limit: number): Promise<ActivityItem[]> {
    // Las últimas entradas y las últimas salidas se combinan y se recortan al límite.
    const [entries, exits] = await this.prisma.$transaction([
      this.prisma.visit.findMany({
        orderBy: { entryAt: 'desc' },
        take: limit,
        select: VISIT_WITH_PERSON,
      }),
      this.prisma.visit.findMany({
        where: { exitAt: { not: null } },
        orderBy: { exitAt: 'desc' },
        take: limit,
        select: VISIT_WITH_PERSON,
      }),
    ]);
    const toItem = (visit: (typeof entries)[number], kind: ActivityItem['kind']): ActivityItem => ({
      visitId: visit.id,
      kind,
      at: (kind === 'ENTRY' ? visit.entryAt : (visit.exitAt as Date)).toISOString(),
      personName: visit.person.fullName,
      personType: visit.personType,
      company: visit.company,
    });
    return [...entries.map((v) => toItem(v, 'ENTRY')), ...exits.map((v) => toItem(v, 'EXIT'))]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit);
  }
}
