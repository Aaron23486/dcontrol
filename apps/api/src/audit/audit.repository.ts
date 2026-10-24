import { Injectable } from '@nestjs/common';
import {
  AuditAction,
  AuditActor,
  AuditEntity,
  AuditLogItem,
  AuditTarget,
  Page,
} from '@cedi/shared';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditFilter {
  createdFrom?: Date;
  createdBefore?: Date;
  action?: AuditAction;
  userId?: string;
  entityId?: string;
  page: number;
  pageSize: number;
}

export abstract class AuditRepository {
  abstract findPage(filter: AuditFilter): Promise<Page<AuditLogItem>>;
  abstract findActors(): Promise<AuditActor[]>;
}

const PERSON_FIELDS = { id: true, fullName: true, identification: true } as const;
const USER_FIELDS = { id: true, name: true, email: true } as const;

@Injectable()
export class PrismaAuditRepository extends AuditRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findPage(filter: AuditFilter): Promise<Page<AuditLogItem>> {
    const where: Prisma.AuditLogWhereInput = {
      action: filter.action,
      userId: filter.userId,
      entityId: filter.entityId,
    };
    if (filter.createdFrom || filter.createdBefore) {
      where.createdAt = { gte: filter.createdFrom, lt: filter.createdBefore };
    }
    const [total, logs] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: USER_FIELDS } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
    ]);
    const targets = await this.resolveTargets(logs);
    return {
      items: logs.map((log) => ({
        id: log.id,
        createdAt: log.createdAt.toISOString(),
        user: log.user,
        action: log.action as AuditAction,
        changedFields: log.changedFields,
        target: targets.get(log.entityId) ?? {
          entity: log.entity as AuditEntity,
          id: log.entityId,
          person: null,
        },
      })),
      total,
      page: filter.page,
      pageSize: filter.pageSize,
    };
  }

  findActors(): Promise<AuditActor[]> {
    return this.prisma.user.findMany({
      where: { auditLogs: { some: {} } },
      select: USER_FIELDS,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * La auditoría guarda solo entidad e id (D12). Para mostrarla se resuelve, en dos consultas,
   * a qué persona se refiere cada registro (en las visitas, la persona de la visita).
   */
  private async resolveTargets(
    logs: { entity: string; entityId: string }[],
  ): Promise<Map<string, AuditTarget>> {
    const idsOf = (entity: AuditEntity) => [
      ...new Set(logs.filter((log) => log.entity === entity).map((log) => log.entityId)),
    ];
    const [persons, visits] = await Promise.all([
      this.prisma.person.findMany({
        where: { id: { in: idsOf(AuditEntity.PERSON) } },
        select: PERSON_FIELDS,
      }),
      this.prisma.visit.findMany({
        where: { id: { in: idsOf(AuditEntity.VISIT) } },
        select: { id: true, entryAt: true, person: { select: PERSON_FIELDS } },
      }),
    ]);
    const targets = new Map<string, AuditTarget>();
    for (const person of persons) {
      targets.set(person.id, { entity: AuditEntity.PERSON, id: person.id, person });
    }
    for (const visit of visits) {
      targets.set(visit.id, {
        entity: AuditEntity.VISIT,
        id: visit.id,
        person: visit.person,
        visitEntryAt: visit.entryAt.toISOString(),
      });
    }
    return targets;
  }
}
