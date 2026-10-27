import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  AuthUser,
  CloseVisitInput,
  EntryRegistered,
  Page,
  VisitDetail,
  VisitListItem,
  VisitListQuery,
  visitListQuerySchema,
  RegisterEntryData,
  ScanData,
  ScanResult,
  VisitSummary,
  closeVisitSchema,
  registerEntrySchema,
  scanSchema,
} from '@cedi/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { ScansService } from './scans.service';
import { VisitHistoryService } from './visit-history.service';
import { VisitsService } from './visits.service';

@Controller('scans')
export class ScansController {
  constructor(private readonly scans: ScansService) {}

  /** Ingresar una cédula: devuelve qué ocurrió o qué falta para completar la operación. */
  @Post()
  @HttpCode(HttpStatus.OK)
  scan(
    @Body(new ZodValidationPipe(scanSchema)) input: ScanData,
    @CurrentUser() user: AuthUser,
  ): Promise<ScanResult> {
    return this.scans.scan(input, user);
  }
}

@Controller('visits')
export class VisitsController {
  constructor(
    private readonly visits: VisitsService,
    private readonly history: VisitHistoryService,
  ) {}

  /** Historial de visitas de un tipo, con filtros de fecha, estado y búsqueda (FR-10). */
  @Get()
  list(
    @Query(new ZodValidationPipe(visitListQuerySchema)) query: VisitListQuery,
  ): Promise<Page<VisitListItem>> {
    return this.history.list(query);
  }

  @Get(':id')
  detail(@Param('id', new ParseUUIDPipe()) id: string): Promise<VisitDetail> {
    return this.history.getDetail(id);
  }

  @Post()
  registerEntry(
    @Body(new ZodValidationPipe(registerEntrySchema)) entry: RegisterEntryData,
    @CurrentUser() user: AuthUser,
  ): Promise<EntryRegistered> {
    return this.visits.registerEntry(entry, user);
  }

  /** D3: cierre manual de una visita olvidada. */
  @Patch(':id/close')
  close(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(closeVisitSchema)) { exitAt }: CloseVisitInput,
    @CurrentUser() user: AuthUser,
  ): Promise<VisitSummary> {
    return this.visits.closeManually(id, exitAt, user);
  }
}
