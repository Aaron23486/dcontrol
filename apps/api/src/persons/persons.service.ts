import { Injectable } from '@nestjs/common';
import {
  AuthUser,
  PERSON_IDENTITY_FIELDS,
  Page,
  PersonData,
  PersonDetail,
  PersonListQuery,
  PersonSummary,
  UpdatePersonData,
  canCorrectPersonIdentity,
  normalizeSearchText,
} from '@cedi/shared';
import { AppException } from '../common/errors/app.exception';
import { CompaniesRepository } from '../companies/companies.repository';
import { ensureCompanyExists, guardIdentification, personNotFound } from './person-guards';
import { searchTermsOf } from './person-search';
import {
  PersonListFilter,
  PersonRecord,
  PersonWrite,
  PersonsRepository,
} from './persons.repository';

/** Visitas que muestra el detalle de una persona; el resto se consulta en el historial. */
export const DETAIL_VISITS_LIMIT = 50;

type EditableField = keyof UpdatePersonData;

@Injectable()
export class PersonsService {
  constructor(
    private readonly persons: PersonsRepository,
    private readonly companies: CompaniesRepository,
  ) {}

  list({ type, q, page, pageSize }: PersonListQuery): Promise<Page<PersonSummary>> {
    const filter: PersonListFilter = { type, page, pageSize, search: searchTermsOf(q) };
    return this.persons.list(filter);
  }

  async getDetail(id: string): Promise<PersonDetail> {
    return (await this.persons.findDetail(id, DETAIL_VISITS_LIMIT)) ?? personNotFound();
  }

  async create(data: PersonData, actor: AuthUser): Promise<PersonSummary> {
    await ensureCompanyExists(this.companies, data.companyId);
    return guardIdentification(data.identification, () =>
      this.persons.create(
        { ...data, nameNormalized: normalizeSearchText(data.fullName) },
        actor.id,
      ),
    );
  }

  /**
   * Aplica solo los campos que realmente cambian. Nombre y cédula son datos fijos:
   * solo un Administrador los corrige (D13). Todo cambio queda auditado.
   */
  async update(id: string, changes: UpdatePersonData, actor: AuthUser): Promise<PersonSummary> {
    const current = (await this.persons.findRecord(id)) ?? personNotFound();
    const changedFields = changedFieldsOf(current, changes);
    if (changedFields.length === 0) {
      return (await this.persons.findSummary(id)) ?? personNotFound();
    }
    const touchesIdentity = changedFields.some((field) =>
      (PERSON_IDENTITY_FIELDS as readonly string[]).includes(field),
    );
    if (touchesIdentity && !canCorrectPersonIdentity(actor.role)) {
      throw AppException.forbidden('Solo un administrador puede corregir el nombre o la cédula.');
    }
    if (changedFields.includes('companyId') && changes.companyId) {
      await ensureCompanyExists(this.companies, changes.companyId);
    }

    const write: Partial<PersonWrite> = {};
    for (const field of changedFields) Object.assign(write, { [field]: changes[field] });
    if (write.fullName) write.nameNormalized = normalizeSearchText(write.fullName);

    return guardIdentification(changes.identification ?? current.identification, () =>
      this.persons.update(id, write, changedFields, actor.id),
    );
  }
}

function changedFieldsOf(current: PersonRecord, changes: UpdatePersonData): EditableField[] {
  return (Object.keys(changes) as EditableField[]).filter(
    (field) => changes[field] !== undefined && changes[field] !== current[field],
  );
}
