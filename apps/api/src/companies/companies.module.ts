import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesRepository, PrismaCompaniesRepository } from './companies.repository';
import { CompaniesService } from './companies.service';

@Module({
  controllers: [CompaniesController],
  providers: [
    CompaniesService,
    { provide: CompaniesRepository, useClass: PrismaCompaniesRepository },
  ],
  exports: [CompaniesRepository],
})
export class CompaniesModule {}
