import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { PersonsModule } from '../persons/persons.module';
import { ScansService } from './scans.service';
import { PrismaVisitHistoryRepository, VisitHistoryRepository } from './visit-history.repository';
import { VisitHistoryService } from './visit-history.service';
import { ScansController, VisitsController } from './visits.controller';
import { PrismaVisitsRepository, VisitsRepository } from './visits.repository';
import { VisitsService } from './visits.service';

@Module({
  imports: [PersonsModule, CompaniesModule],
  controllers: [ScansController, VisitsController],
  providers: [
    ScansService,
    VisitsService,
    VisitHistoryService,
    { provide: VisitHistoryRepository, useClass: PrismaVisitHistoryRepository },
    { provide: VisitsRepository, useClass: PrismaVisitsRepository },
  ],
})
export class VisitsModule {}
