import {
  AuthUser,
  ErrorCode,
  PersonSummary,
  PersonType,
  Role,
  type CompanySummary,
} from '@cedi/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppException } from '../common/errors/app.exception';
import { CompaniesRepository, FindOrCreateResult } from '../companies/companies.repository';
import {
  IdentificationTakenError,
  PersonListFilter,
  PersonRecord,
  PersonWrite,
  PersonsRepository,
} from './persons.repository';
import { PersonsService } from './persons.service';

const COMPANY_A: CompanySummary = { id: 'company-a', name: 'Acme' };
const COMPANY_B: CompanySummary = { id: 'company-b', name: 'Beta' };

class FakeCompanies extends CompaniesRepository {
  search = () => Promise.resolve([COMPANY_A, COMPANY_B]);
  findById = (id: string) =>
    Promise.resolve([COMPANY_A, COMPANY_B].find((c) => c.id === id) ?? null);
  findOrCreate = (): Promise<FindOrCreateResult> => Promise.reject(new Error('no usado'));
}

class FakePersons extends PersonsRepository {
  record: PersonRecord = {
    id: 'p1',
    fullName: 'Juan Pérez',
    identification: '1234567',
    type: PersonType.EXTERNAL_WORKER,
    companyId: COMPANY_A.id,
  };
  lastFilter?: PersonListFilter;
  lastCreate?: PersonWrite;
  lastUpdate?: { changes: Partial<PersonWrite>; changedFields: string[]; actorId: string };
  identificationTaken = false;

  private summary(): PersonSummary {
    const company = this.record.companyId === COMPANY_B.id ? COMPANY_B : COMPANY_A;
    return { ...this.record, company, isInside: false, lastVisit: null };
  }

  list = (filter: PersonListFilter) => {
    this.lastFilter = filter;
    return Promise.resolve({ items: [], total: 0, page: filter.page, pageSize: filter.pageSize });
  };
  findRecord = (id: string) => Promise.resolve(id === this.record.id ? this.record : null);
  findSummary = () => Promise.resolve(this.summary());
  findSummaryByIdentification = () => Promise.resolve(null);
  findDetail = () => Promise.resolve(null);
  create = (data: PersonWrite) => {
    if (this.identificationTaken) return Promise.reject(new IdentificationTakenError());
    this.lastCreate = data;
    return Promise.resolve(this.summary());
  };
  update = (
    _id: string,
    changes: Partial<PersonWrite>,
    changedFields: string[],
    actorId: string,
  ) => {
    if (this.identificationTaken) return Promise.reject(new IdentificationTakenError());
    this.lastUpdate = { changes, changedFields, actorId };
    return Promise.resolve(this.summary());
  };
}

const guard: AuthUser = { id: 'u1', name: 'Guarda', email: 'g@cedi.test', role: Role.SECURITY };
const admin: AuthUser = { id: 'u2', name: 'Admin', email: 'a@cedi.test', role: Role.ADMIN };

const errorOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(AppException);
    return (error as AppException).getResponse() as { code: string; message: string };
  }
  throw new Error('Se esperaba un error');
};

describe('PersonsService', () => {
  let persons: FakePersons;
  let service: PersonsService;

  beforeEach(() => {
    persons = new FakePersons();
    service = new PersonsService(persons, new FakeCompanies());
  });

  describe('list', () => {
    it('normaliza la búsqueda por nombre, cédula y empresa (D15)', async () => {
      await service.list({ type: PersonType.VISITOR, q: ' pérez ', page: 1, pageSize: 20 });
      expect(persons.lastFilter?.search).toEqual({
        name: 'PEREZ',
        company: 'PEREZ',
        identificationPrefix: '',
      });
    });

    it('un texto con forma de cédula también busca por prefijo de cédula', async () => {
      await service.list({ type: PersonType.VISITOR, q: '001-12', page: 1, pageSize: 20 });
      expect(persons.lastFilter?.search?.identificationPrefix).toBe('00112');
    });

    it('sin texto de búsqueda no filtra', async () => {
      await service.list({ type: PersonType.VISITOR, q: '  ', page: 1, pageSize: 20 });
      expect(persons.lastFilter?.search).toBeUndefined();
    });
  });

  describe('create', () => {
    const data = {
      fullName: 'José Núñez',
      identification: '7654321',
      type: PersonType.VISITOR,
      companyId: COMPANY_A.id,
    };

    it('calcula el nombre normalizado', async () => {
      await service.create(data, guard);
      expect(persons.lastCreate?.nameNormalized).toBe('JOSE NUNEZ');
    });

    it('rechaza una empresa inexistente', async () => {
      expect(await errorOf(service.create({ ...data, companyId: 'no-existe' }, guard))).toEqual({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'La empresa seleccionada no existe.',
      });
    });

    it('R13: informa que la cédula ya está registrada', async () => {
      persons.identificationTaken = true;
      expect(await errorOf(service.create(data, guard))).toEqual({
        code: ErrorCode.CONFLICT,
        message: 'Ya existe una persona registrada con la cédula 7654321.',
      });
    });
  });

  describe('update (D13)', () => {
    it('Seguridad cambia tipo y empresa; se auditan solo los campos que cambiaron', async () => {
      await service.update(
        'p1',
        { type: PersonType.CONTRACTOR, companyId: COMPANY_B.id, fullName: 'Juan Pérez' },
        guard,
      );
      expect(persons.lastUpdate).toEqual({
        changes: { type: PersonType.CONTRACTOR, companyId: COMPANY_B.id },
        changedFields: ['type', 'companyId'],
        actorId: guard.id,
      });
    });

    it.each([{ fullName: 'Juan P. Gómez' }, { identification: '9999999' }])(
      'Seguridad no puede corregir nombre ni cédula: %o',
      async (changes) => {
        expect(await errorOf(service.update('p1', changes, guard))).toEqual({
          code: ErrorCode.FORBIDDEN,
          message: 'Solo un administrador puede corregir el nombre o la cédula.',
        });
        expect(persons.lastUpdate).toBeUndefined();
      },
    );

    it('Administrador corrige el nombre y se recalcula el normalizado', async () => {
      await service.update('p1', { fullName: 'Juan Pérez Gómez' }, admin);
      expect(persons.lastUpdate?.changes).toEqual({
        fullName: 'Juan Pérez Gómez',
        nameNormalized: 'JUAN PEREZ GOMEZ',
      });
      expect(persons.lastUpdate?.changedFields).toEqual(['fullName']);
    });

    it('si nada cambia no escribe ni audita', async () => {
      await service.update('p1', { type: PersonType.EXTERNAL_WORKER }, guard);
      expect(persons.lastUpdate).toBeUndefined();
    });

    it('enviar el mismo nombre no cuenta como corrección (Seguridad puede guardar)', async () => {
      await service.update('p1', { fullName: 'Juan Pérez', type: PersonType.VISITOR }, guard);
      expect(persons.lastUpdate?.changedFields).toEqual(['type']);
    });

    it('persona inexistente: 404', async () => {
      expect(
        (await errorOf(service.update('otra', { type: PersonType.VISITOR }, guard))).code,
      ).toBe(ErrorCode.NOT_FOUND);
    });
  });
});
