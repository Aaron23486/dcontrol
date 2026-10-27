import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ErrorCode, Page, VisitDetail, VisitListItem, VisitListQuery } from '@cedi/shared';
import { AppException } from '../common/errors/app.exception';
import { nextLocalDate, startOfLocalDate } from '../common/time/clock';
import { APP_CONFIG, AppConfig } from '../config/app-config';
import { searchTermsOf } from '../persons/person-search';
import { VisitHistoryRepository } from './visit-history.repository';

/** Historial de visitas (FR-10). Las fechas son días del CEDI (D6). */
@Injectable()
export class VisitHistoryService {
  constructor(
    private readonly history: VisitHistoryRepository,
    @Inject(APP_CONFIG) private readonly config: Pick<AppConfig, 'timezone'>,
  ) {}

  list({
    type,
    from,
    to,
    status,
    q,
    page,
    pageSize,
  }: VisitListQuery): Promise<Page<VisitListItem>> {
    const { timezone } = this.config;
    return this.history.findPage({
      type,
      status,
      page,
      pageSize,
      search: searchTermsOf(q),
      entryFrom: from ? startOfLocalDate(from, timezone) : undefined,
      // `to` es inclusivo: se toman las entradas antes del inicio del día siguiente.
      entryBefore: to ? startOfLocalDate(nextLocalDate(to), timezone) : undefined,
    });
  }

  async getDetail(visitId: string): Promise<VisitDetail> {
    const visit = await this.history.findDetail(visitId);
    if (!visit) {
      throw new AppException(ErrorCode.NOT_FOUND, 'La visita no existe.', HttpStatus.NOT_FOUND);
    }
    return visit;
  }
}
