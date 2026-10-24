import { Injectable } from '@nestjs/common';
import { PersonType, VisitDetails, VisitSummary } from '@cedi/shared';
import { AuditAction, AuditEntity, recordAudit } from '../audit/audit-log';
import type { Prisma } from '../generated/prisma/client';
import {
  createPersonInTx,
  IdentificationTakenError,
  PersonWrite,
} from '../persons/persons.repository';
import { isUniqueViolation } from '../prisma/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { VISIT_INCLUDE, toVisitSummary } from './visit.mapper';

/** R1: la persona ya tiene una visita abierta (lo garantiza el índice único parcial). */
export class AlreadyInsideError extends Error {}

/** Datos mínimos de una visita para decidir la operación de un escaneo. */
export interface VisitRecord {
  id: string;
  personType: PersonType;
  entryAt: Date;
  exitAt: Date | null;
  purpose: string | null;
  area: string | null;
}

/** Copia del tipo y la empresa vigentes de la persona al entrar (R17), con la hora de entrada. */
export interface EntrySnapshot {
  personId: string;
  personType: PersonType;
  companyId: string;
  entryAt: Date;
}

export type CloseAction =
  typeof AuditAction.VISIT_EXIT_REGISTERED | typeof AuditAction.VISIT_CLOSED_MANUALLY;

export abstract class VisitsRepository {
  /** La visita más reciente (si está abierta, es la única abierta: R1). */
  abstract findLatest(personId: string): Promise<VisitRecord | null>;
  /** Última visita del tipo indicado con motivo y área, para prellenar (D1). */
  abstract findLatestWithDetails(personId: string, type: PersonType): Promise<VisitRecord | null>;
  abstract findRecord(visitId: string): Promise<VisitRecord | null>;
  abstract findSummary(visitId: string): Promise<VisitSummary | null>;
  /** Registra la entrada; lanza AlreadyInsideError si ya hay una visita abierta. */
  abstract createEntry(
    snapshot: EntrySnapshot,
    details: VisitDetails,
    actorId: string,
  ): Promise<VisitSummary>;
  /** Crea la persona y su primera entrada en una sola transacción. */
  abstract createPersonWithEntry(
    person: PersonWrite,
    entryAt: Date,
    details: VisitDetails,
    actorId: string,
  ): Promise<{ personId: string; visit: VisitSummary }>;
  /** Cierra la visita solo si sigue abierta; devuelve `null` si ya estaba cerrada. */
  abstract close(
    visitId: string,
    exitAt: Date,
    actorId: string,
    action: CloseAction,
  ): Promise<VisitSummary | null>;
}

const RECORD_FIELDS = {
  id: true,
  personType: true,
  entryAt: true,
  exitAt: true,
  purpose: true,
  area: true,
} as const;

/** Datos de la visita según el tipo; las herramientas solo existen para el técnico (R16, R19). */
function visitDataOf(details: VisitDetails) {
  return {
    purpose: 'purpose' in details ? details.purpose : null,
    area: 'area' in details ? details.area : null,
    tools:
      'tools' in details && details.tools.length > 0
        ? {
            create: details.tools.map((tool) => ({
              name: tool.name,
              description: tool.description ?? null,
              quantity: tool.quantity ?? null,
            })),
          }
        : undefined,
  };
}

async function createEntryInTx(
  tx: Prisma.TransactionClient,
  snapshot: EntrySnapshot,
  details: VisitDetails,
  actorId: string,
): Promise<VisitSummary> {
  const visit = await tx.visit.create({
    data: { ...snapshot, entryById: actorId, ...visitDataOf(details) },
    include: VISIT_INCLUDE,
  });
  await recordAudit(tx, {
    userId: actorId,
    action: AuditAction.VISIT_ENTRY_REGISTERED,
    entity: AuditEntity.VISIT,
    entityId: visit.id,
    changedFields: [],
  });
  return toVisitSummary(visit);
}

@Injectable()
export class PrismaVisitsRepository extends VisitsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findLatest(personId: string): Promise<VisitRecord | null> {
    return this.prisma.visit.findFirst({
      where: { personId },
      orderBy: { entryAt: 'desc' },
      select: RECORD_FIELDS,
    });
  }

  findLatestWithDetails(personId: string, type: PersonType): Promise<VisitRecord | null> {
    return this.prisma.visit.findFirst({
      where: { personId, personType: type, purpose: { not: null }, area: { not: null } },
      orderBy: { entryAt: 'desc' },
      select: RECORD_FIELDS,
    });
  }

  findRecord(visitId: string): Promise<VisitRecord | null> {
    return this.prisma.visit.findUnique({ where: { id: visitId }, select: RECORD_FIELDS });
  }

  async findSummary(visitId: string): Promise<VisitSummary | null> {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: VISIT_INCLUDE,
    });
    return visit ? toVisitSummary(visit) : null;
  }

  async createEntry(
    snapshot: EntrySnapshot,
    details: VisitDetails,
    actorId: string,
  ): Promise<VisitSummary> {
    try {
      return await this.prisma.$transaction((tx) =>
        createEntryInTx(tx, snapshot, details, actorId),
      );
    } catch (error) {
      // La persona existe, así que la única restricción única posible es la visita abierta (R1).
      if (isUniqueViolation(error)) throw new AlreadyInsideError();
      throw error;
    }
  }

  async createPersonWithEntry(
    personData: PersonWrite,
    entryAt: Date,
    details: VisitDetails,
    actorId: string,
  ): Promise<{ personId: string; visit: VisitSummary }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await createPersonInTx(tx, personData, actorId);
        const visit = await createEntryInTx(
          tx,
          {
            personId: created.id,
            personType: created.type,
            companyId: created.company.id,
            entryAt,
          },
          details,
          actorId,
        );
        return { personId: created.id, visit };
      });
    } catch (error) {
      // Persona nueva: no puede tener visitas abiertas, así que el duplicado es la cédula (R13).
      if (isUniqueViolation(error)) throw new IdentificationTakenError();
      throw error;
    }
  }

  async close(
    visitId: string,
    exitAt: Date,
    actorId: string,
    action: CloseAction,
  ): Promise<VisitSummary | null> {
    return this.prisma.$transaction(async (tx) => {
      // Condición `exitAt: null`: si otra caseta ya registró la salida, no se pisa (R2).
      const { count } = await tx.visit.updateMany({
        where: { id: visitId, exitAt: null },
        data: { exitAt, exitById: actorId },
      });
      if (count === 0) return null;
      await recordAudit(tx, {
        userId: actorId,
        action,
        entity: AuditEntity.VISIT,
        entityId: visitId,
        changedFields: ['exitAt'],
      });
      const visit = await tx.visit.findUniqueOrThrow({
        where: { id: visitId },
        include: VISIT_INCLUDE,
      });
      return toVisitSummary(visit);
    });
  }
}
