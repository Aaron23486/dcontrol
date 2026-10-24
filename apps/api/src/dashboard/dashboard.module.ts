import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardRepository, PrismaDashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    { provide: DashboardRepository, useClass: PrismaDashboardRepository },
  ],
})
export class DashboardModule {}
