import { Injectable } from '@nestjs/common';
import { CompanySummary } from '@cedi/shared';
import { isUniqueViolation } from '../prisma/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';

export interface FindOrCreateResult {
  company: CompanySummary;
  created: boolean;
}

export abstract class CompaniesRepository {
  /** Empresas cuyo nombre normalizado contiene el texto (vacío = todas), ordenadas por nombre. */
  abstract search(normalizedQuery: string, limit: number): Promise<CompanySummary[]>;
  abstract findById(id: string): Promise<CompanySummary | null>;
  abstract findOrCreate(name: string, nameNormalized: string): Promise<FindOrCreateResult>;
}

const COMPANY_FIELDS = { id: true, name: true } as const;

@Injectable()
export class PrismaCompaniesRepository extends CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  search(normalizedQuery: string, limit: number): Promise<CompanySummary[]> {
    return this.prisma.company.findMany({
      where: normalizedQuery ? { nameNormalized: { contains: normalizedQuery } } : undefined,
      orderBy: { name: 'asc' },
      take: limit,
      select: COMPANY_FIELDS,
    });
  }

  findById(id: string): Promise<CompanySummary | null> {
    return this.prisma.company.findUnique({ where: { id }, select: COMPANY_FIELDS });
  }

  async findOrCreate(name: string, nameNormalized: string): Promise<FindOrCreateResult> {
    const existing = await this.findByNormalizedName(nameNormalized);
    if (existing) return { company: existing, created: false };
    try {
      const company = await this.prisma.company.create({
        data: { name, nameNormalized },
        select: COMPANY_FIELDS,
      });
      return { company, created: true };
    } catch (error) {
      // Otra caseta la creó al mismo tiempo: se usa la existente.
      const concurrent = isUniqueViolation(error)
        ? await this.findByNormalizedName(nameNormalized)
        : null;
      if (concurrent) return { company: concurrent, created: false };
      throw error;
    }
  }

  private findByNormalizedName(nameNormalized: string): Promise<CompanySummary | null> {
    return this.prisma.company.findUnique({ where: { nameNormalized }, select: COMPANY_FIELDS });
  }
}
