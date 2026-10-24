import { Inject, Injectable } from '@nestjs/common';
import { DashboardSummary, InsideVisit } from '@cedi/shared';
import { Clock, startOfDay } from '../common/time/clock';
import { APP_CONFIG, AppConfig } from '../config/app-config';
import { DashboardRepository } from './dashboard.repository';

export const RECENT_ACTIVITY_LIMIT = 15;

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboard: DashboardRepository,
    private readonly clock: Clock,
    @Inject(APP_CONFIG) private readonly config: Pick<AppConfig, 'timezone'>,
  ) {}

  async summary(): Promise<DashboardSummary> {
    const today = this.startOfToday();
    const [counts, recentActivity] = await Promise.all([
      this.dashboard.countDay(today),
      this.dashboard.findRecentActivity(RECENT_ACTIVITY_LIMIT),
    ]);
    return { ...counts, recentActivity };
  }

  inside(): Promise<InsideVisit[]> {
    return this.dashboard.findInside(this.startOfToday());
  }

  /** «Hoy» empieza a medianoche en la zona horaria del CEDI (D6). */
  private startOfToday(): Date {
    return startOfDay(this.clock.now(), this.config.timezone);
  }
}
