import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AuthUser,
  EntryRegistered,
  ErrorCode,
  RegisterEntryData,
  VisitSummary,
  normalizeSearchText,
} from '@cedi/shared';
import { AuditAction } from '../audit/audit-log';
import { AppException } from '../common/errors/app.exception';
import { CompaniesRepository } from '../companies/companies.repository';
import { APP_CONFIG, AppConfig } from '../config/app-config';
import { ensureCompanyExists, guardIdentification, personNotFound } from '../persons/person-guards';
import { PersonsRepository } from '../persons/persons.repository';
import { Clock } from '../common/time/clock';
import { AlreadyInsideError, VisitsRepository } from './visits.repository';

const conflict = (message: string) =>
  new AppException(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT);

/** Casos de uso de visitas: entrada, salida y cierre manual de visitas olvidadas. */
@Injectable()
export class VisitsService {
  constructor(
    private readonly visits: VisitsRepository,
    private readonly persons: PersonsRepository,
    private readonly companies: CompaniesRepository,
    private readonly clock: Clock,
    @Inject(APP_CONFIG) private readonly config: Pick<AppConfig, 'timezone'>,
  ) {}

  /**
   * Registra una entrada. La visita copia el tipo y la empresa vigentes (R17) y solo
   * lleva los datos de su tipo (R18, R19). Nunca hay dos visitas abiertas (R1).
   */
  async registerEntry(entry: RegisterEntryData, actor: AuthUser): Promise<EntryRegistered> {
    const entryAt = this.clock.now();
    if ('newPerson' in entry) {
      const { newPerson, details } = entry;
      await ensureCompanyExists(this.companies, newPerson.companyId);
      const { personId, visit } = await guardIdentification(newPerson.identification, () =>
        this.visits.createPersonWithEntry(
          { ...newPerson, nameNormalized: normalizeSearchText(newPerson.fullName) },
          entryAt,
          details,
          actor.id,
        ),
      );
      return { person: (await this.persons.findSummary(personId)) ?? personNotFound(), visit };
    }

    const person = (await this.persons.findSummary(entry.personId)) ?? personNotFound();
    if (entry.details.personType !== person.type) {
      throw AppException.validation(
        'Los datos de la visita no corresponden al tipo de la persona. Vuelve a ingresar su cédula.',
      );
    }
    const alreadyInside = conflict(`${person.fullName} ya está dentro del CEDI.`);
    if (person.isInside) throw alreadyInside;
    try {
      const visit = await this.visits.createEntry(
        { personId: person.id, personType: person.type, companyId: person.company.id, entryAt },
        entry.details,
        actor.id,
      );
      return { person: (await this.persons.findSummary(person.id)) ?? personNotFound(), visit };
    } catch (error) {
      // Otra caseta registró la entrada al mismo tiempo (R1, garantizado en BD).
      if (error instanceof AlreadyInsideError) throw alreadyInside;
      throw error;
    }
  }

  /** Registra la salida de una visita abierta (R2: sin visita abierta no hay salida). */
  async registerExit(visitId: string, actor: AuthUser): Promise<VisitSummary> {
    const visit = await this.visits.close(
      visitId,
      this.clock.now(),
      actor.id,
      AuditAction.VISIT_EXIT_REGISTERED,
    );
    return visit ?? this.throwAlreadyClosed();
  }

  /** D3: cierra una visita olvidada con la hora real de salida que indica el guarda. */
  async closeManually(visitId: string, exitAtIso: string, actor: AuthUser): Promise<VisitSummary> {
    const visit = await this.visits.findRecord(visitId);
    if (!visit) {
      throw new AppException(ErrorCode.NOT_FOUND, 'La visita no existe.', HttpStatus.NOT_FOUND);
    }
    if (visit.exitAt) this.throwAlreadyClosed();
    const exitAt = new Date(exitAtIso);
    if (exitAt < visit.entryAt) {
      throw AppException.validation(
        `La hora de salida no puede ser anterior a la entrada (${this.formatLocal(visit.entryAt)}).`,
      );
    }
    if (exitAt > this.clock.now()) {
      throw AppException.validation('La hora de salida no puede estar en el futuro.');
    }
    const closed = await this.visits.close(
      visitId,
      exitAt,
      actor.id,
      AuditAction.VISIT_CLOSED_MANUALLY,
    );
    return closed ?? this.throwAlreadyClosed();
  }

  /** Fecha y hora en la zona horaria del CEDI, para los mensajes al guarda (D6). */
  private formatLocal(instant: Date): string {
    return new Intl.DateTimeFormat('es', {
      timeZone: this.config.timezone,
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(instant);
  }

  private throwAlreadyClosed(): never {
    throw conflict('Esta visita ya tiene la salida registrada.');
  }
}
