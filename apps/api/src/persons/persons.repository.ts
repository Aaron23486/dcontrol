import { Injectable } from '@nestjs/common';
import { Page, PersonDetail, PersonSummary, PersonType } from '@cedi/shared';
import { AuditAction, AuditEntity, recordAudit } from '../audit/audit-log';
import type { Prisma } from '../generated/prisma/client';
import { isUniqueViolation } from '../prisma/prisma-errors';
import type { SearchTerms } from './person-search';
import { PrismaService } from '../prisma/prisma.service';
import { DETAIL_INCLUDE, SUMMARY_INCLUDE, toPersonDetail, toPersonSummary } from './persons.mapper';

/** La cédula ya pertenece a otra persona (R13). */
export class IdentificationTakenError extends Error {}

export interface PersonRecord {
  id: string;
  fullName: string;
  identification: string;
  type: PersonType;
  companyId: string;
}

/** Datos que se escriben en `persons`; `nameNormalized` lo calcula el servicio (D15). */
export interface PersonWrite {
  fullName: string;
  nameNormalized: string;
  identification: string;
  type: PersonType;
  companyId: string;
}

/** Filtro de una sección de personas, ya normalizado por el servicio. */
export interface PersonListFilter {
  type: PersonType;
  /** Si hay búsqueda: coincide por nombre, prefijo de cédula o empresa. */
  search?: SearchTerms;
  page: number;
  pageSize: number;
}

export abstract class PersonsRepository {
  abstract list(filter: PersonListFilter): Promise<Page<PersonSummary>>;
  abstract findRecord(id: string): Promise<PersonRecord | null>;
  abstract findSummary(id: string): Promise<PersonSummary | null>;
  abstract findSummaryByIdentification(identification: string): Promise<PersonSummary | null>;
  abstract findDetail(id: string, visitsLimit: number): Promise<PersonDetail | null>;
  /** Crea la persona y su registro de auditoría en una transacción. */
  abstract create(data: PersonWrite, actorId: string): Promise<PersonSummary>;
  /** Aplica los cambios y audita los nombres de los campos modificados en una transacción. */
  abstract update(
    id: string,
    changes: Partial<PersonWrite>,
    changedFields: string[],
    actorId: string,
  ): Promise<PersonSummary>;
}

/** Crea una persona y audita su alta dentro de una transacción existente. */
export async function createPersonInTx(
  tx: Prisma.TransactionClient,
  data: PersonWrite,
  actorId: string,
): Promise<PersonSummary> {
  const person = await tx.person.create({ data, include: SUMMARY_INCLUDE });
  await recordAudit(tx, {
    userId: actorId,
    action: AuditAction.PERSON_CREATED,
    entity: AuditEntity.PERSON,
    entityId: person.id,
    changedFields: [],
  });
  return toPersonSummary(person);
}

const RECORD_FIELDS = {
  id: true,
  fullName: true,
  identification: true,
  type: true,
  companyId: true,
} as const;

@Injectable()
export class PrismaPersonsRepository extends PersonsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list({ type, search, page, pageSize }: PersonListFilter): Promise<Page<PersonSummary>> {
    const where: Prisma.PersonWhereInput = { type };
    if (search) {
      where.OR = [
        { nameNormalized: { contains: search.name } },
        { company: { nameNormalized: { contains: search.company } } },
        ...(search.identificationPrefix
          ? [{ identification: { startsWith: search.identificationPrefix } }]
          : []),
      ];
    }
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.person.count({ where }),
      this.prisma.person.findMany({
        where,
        include: SUMMARY_INCLUDE,
        orderBy: [{ nameNormalized: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { items: rows.map(toPersonSummary), total, page, pageSize };
  }

  findRecord(id: string): Promise<PersonRecord | null> {
    return this.prisma.person.findUnique({ where: { id }, select: RECORD_FIELDS });
  }

  async findSummary(id: string): Promise<PersonSummary | null> {
    const row = await this.prisma.person.findUnique({ where: { id }, include: SUMMARY_INCLUDE });
    return row ? toPersonSummary(row) : null;
  }

  async findSummaryByIdentification(identification: string): Promise<PersonSummary | null> {
    const row = await this.prisma.person.findUnique({
      where: { identification },
      include: SUMMARY_INCLUDE,
    });
    return row ? toPersonSummary(row) : null;
  }

  async findDetail(id: string, visitsLimit: number): Promise<PersonDetail | null> {
    const row = await this.prisma.person.findUnique({
      where: { id },
      include: DETAIL_INCLUDE(visitsLimit),
    });
    return row ? toPersonDetail(row) : null;
  }

  create(data: PersonWrite, actorId: string): Promise<PersonSummary> {
    return this.writeIdentityGuarded((tx) => createPersonInTx(tx, data, actorId));
  }

  update(
    id: string,
    changes: Partial<PersonWrite>,
    changedFields: string[],
    actorId: string,
  ): Promise<PersonSummary> {
    return this.writeIdentityGuarded(async (tx) => {
      const person = await tx.person.update({
        where: { id },
        data: changes,
        include: SUMMARY_INCLUDE,
      });
      await recordAudit(tx, {
        userId: actorId,
        action: AuditAction.PERSON_UPDATED,
        entity: AuditEntity.PERSON,
        entityId: id,
        changedFields,
      });
      return toPersonSummary(person);
    });
  }

  /** Ejecuta la escritura en una transacción y traduce la cédula duplicada a un error de dominio. */
  private async writeIdentityGuarded<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(work);
    } catch (error) {
      if (isUniqueViolation(error)) throw new IdentificationTakenError();
      throw error;
    }
  }
}
