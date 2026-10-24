import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  AuthUser,
  Page,
  PersonData,
  PersonDetail,
  PersonListQuery,
  PersonSummary,
  UpdatePersonData,
  personListQuerySchema,
  personSchema,
  updatePersonSchema,
} from '@cedi/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { PersonsService } from './persons.service';

/** Ambos roles acceden; la regla de quién corrige nombre y cédula vive en el servicio. */
@Controller('persons')
export class PersonsController {
  constructor(private readonly persons: PersonsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(personListQuerySchema)) query: PersonListQuery,
  ): Promise<Page<PersonSummary>> {
    return this.persons.list(query);
  }

  @Get(':id')
  detail(@Param('id', new ParseUUIDPipe()) id: string): Promise<PersonDetail> {
    return this.persons.getDetail(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(personSchema)) data: PersonData,
    @CurrentUser() user: AuthUser,
  ): Promise<PersonSummary> {
    return this.persons.create(data, user);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updatePersonSchema)) changes: UpdatePersonData,
    @CurrentUser() user: AuthUser,
  ): Promise<PersonSummary> {
    return this.persons.update(id, changes, user);
  }
}
