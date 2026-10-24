import { Controller, Get } from '@nestjs/common';
import { DashboardSummary, InsideVisit } from '@cedi/shared';
import { DashboardService } from './dashboard.service';

/** Lecturas en vivo para la caseta; ambos roles acceden. */
@Controller()
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('dashboard/summary')
  summary(): Promise<DashboardSummary> {
    return this.dashboard.summary();
  }

  /** ¿Quién está dentro del CEDI ahora? (spec §17) */
  @Get('visits/inside')
  inside(): Promise<InsideVisit[]> {
    return this.dashboard.inside();
  }
}
