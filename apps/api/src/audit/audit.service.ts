import { Inject, Injectable } from '@nestjs/common';
import { AuditActor, AuditListQuery, AuditLogItem, Page } from '@cedi/shared';
import { nextLocalDate, startOfLocalDate } from '../common/time/clock';
import { APP_CONFIG, AppConfig } from '../config/app-config';
import { AuditRepository } from './audit.repository';

/** Consulta de la auditoría (D12). Las fechas son días del CEDI (D6). */
@Injectable()
export class AuditService {
  constructor(
    private readonly audit: AuditRepository,
    @Inject(APP_CONFIG) private readonly config: Pick<AppConfig, 'timezone'>,
  ) {}

  list({
    from,
    to,
    action,
    userId,
    entityId,
    page,
    pageSize,
  }: AuditListQuery): Promise<Page<AuditLogItem>> {
    const { timezone } = this.config;
    return this.audit.findPage({
      action,
      userId,
      entityId,
      page,
      pageSize,
      createdFrom: from ? startOfLocalDate(from, timezone) : undefined,
      createdBefore: to ? startOfLocalDate(nextLocalDate(to), timezone) : undefined,
    });
  }

  actors(): Promise<AuditActor[]> {
    return this.audit.findActors();
  }
}
