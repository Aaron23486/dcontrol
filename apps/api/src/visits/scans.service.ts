import { Inject, Injectable } from '@nestjs/common';
import {
  AuthUser,
  DOUBLE_SCAN_WINDOW_SECONDS,
  PersonSummary,
  PersonType,
  ScanData,
  ScanResult,
  ScanResultCode,
} from '@cedi/shared';
import { APP_CONFIG, AppConfig } from '../config/app-config';
import { personNotFound } from '../persons/person-guards';
import { PersonsRepository } from '../persons/persons.repository';
import { Clock, calendarDate } from '../common/time/clock';
import { VisitRecord, VisitsRepository } from './visits.repository';
import { VisitsService } from './visits.service';

/**
 * Decide qué significa ingresar una cédula (FR-5-11, ADR 0006):
 * registrar a alguien nuevo, registrar su salida o preparar su entrada.
 */
@Injectable()
export class ScansService {
  constructor(
    private readonly persons: PersonsRepository,
    private readonly visits: VisitsRepository,
    private readonly visitsService: VisitsService,
    private readonly clock: Clock,
    @Inject(APP_CONFIG) private readonly config: Pick<AppConfig, 'timezone'>,
  ) {}

  async scan({ identification, confirmed }: ScanData, actor: AuthUser): Promise<ScanResult> {
    const person = await this.persons.findSummaryByIdentification(identification);
    if (!person) return { result: ScanResultCode.PERSON_NOT_FOUND, identification };

    const latest = await this.visits.findLatest(person.id);
    const now = this.clock.now();

    if (latest && latest.exitAt === null) {
      if (!confirmed && this.isFromPreviousDay(latest, now)) {
        const visit = await this.visits.findSummary(latest.id);
        if (visit) return { result: ScanResultCode.PREVIOUS_DAY_VISIT_OPEN, person, visit };
      }
      if (!confirmed && isWithinDoubleScanWindow(latest.entryAt, now)) {
        return confirmationRequired(person, 'EXIT', latest.entryAt);
      }
      const visit = await this.visitsService.registerExit(latest.id, actor);
      const updated = (await this.persons.findSummary(person.id)) ?? personNotFound();
      return { result: ScanResultCode.EXIT_REGISTERED, person: updated, visit };
    }

    if (!confirmed && latest?.exitAt && isWithinDoubleScanWindow(latest.exitAt, now)) {
      return confirmationRequired(person, 'ENTRY', latest.exitAt);
    }
    return { result: ScanResultCode.ENTRY_PENDING, person, prefill: await this.prefillFor(person) };
  }

  /** D3: la visita abierta empezó en un día anterior según la zona horaria del CEDI. */
  private isFromPreviousDay(visit: VisitRecord, now: Date): boolean {
    return (
      calendarDate(visit.entryAt, this.config.timezone) < calendarDate(now, this.config.timezone)
    );
  }

  /** D1: propone el motivo y el área de la última visita del mismo tipo. */
  private async prefillFor(person: PersonSummary) {
    if (person.type === PersonType.EXTERNAL_WORKER) return null;
    const last = await this.visits.findLatestWithDetails(person.id, person.type);
    return last?.purpose && last.area ? { purpose: last.purpose, area: last.area } : null;
  }
}

function isWithinDoubleScanWindow(lastOperation: Date, now: Date): boolean {
  return now.getTime() - lastOperation.getTime() < DOUBLE_SCAN_WINDOW_SECONDS * 1000;
}

function confirmationRequired(
  person: PersonSummary,
  pendingAction: 'ENTRY' | 'EXIT',
  lastOperation: Date,
): ScanResult {
  return {
    result: ScanResultCode.CONFIRMATION_REQUIRED,
    person,
    pendingAction,
    lastOperationAt: lastOperation.toISOString(),
  };
}
