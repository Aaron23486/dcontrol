import { Injectable } from '@nestjs/common';
import { CompanySummary, normalizeCompanyName } from '@cedi/shared';
import { CompaniesRepository, FindOrCreateResult } from './companies.repository';

const AUTOCOMPLETE_LIMIT = 10;

@Injectable()
export class CompaniesService {
  constructor(private readonly companies: CompaniesRepository) {}

  /** Autocompletado: compara contra el nombre normalizado («acme sa» encuentra «ACME S.A.»). */
  search(query = ''): Promise<CompanySummary[]> {
    return this.companies.search(normalizeCompanyName(query), AUTOCOMPLETE_LIMIT);
  }

  /** Crea la empresa o devuelve la existente con el mismo nombre normalizado (D9). */
  findOrCreate(name: string): Promise<FindOrCreateResult> {
    return this.companies.findOrCreate(name, normalizeCompanyName(name));
  }
}
