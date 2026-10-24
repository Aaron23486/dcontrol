import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { PersonsController } from './persons.controller';
import { PersonsRepository, PrismaPersonsRepository } from './persons.repository';
import { PersonsService } from './persons.service';

@Module({
  imports: [CompaniesModule],
  controllers: [PersonsController],
  providers: [PersonsService, { provide: PersonsRepository, useClass: PrismaPersonsRepository }],
  exports: [PersonsRepository],
})
export class PersonsModule {}
