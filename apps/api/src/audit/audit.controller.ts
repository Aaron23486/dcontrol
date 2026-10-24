import { Controller, Get, Query } from '@nestjs/common';
import {
  AuditActor,
  AuditListQuery,
  AuditLogItem,
  Page,
  Role,
  auditListQuerySchema,
} from '@cedi/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { AuditService } from './audit.service';

/** Solo el Administrador consulta la auditoría (D12); aplica a toda la clase. */
@Roles(Role.ADMIN)
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(auditListQuerySchema)) query: AuditListQuery,
  ): Promise<Page<AuditLogItem>> {
    return this.audit.list(query);
  }

  /** Usuarios con registros, para el filtro por usuario. */
  @Get('actors')
  actors(): Promise<AuditActor[]> {
    return this.audit.actors();
  }
}
