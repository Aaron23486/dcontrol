import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditRepository, PrismaAuditRepository } from './audit.repository';
import { AuditService } from './audit.service';

@Module({
  controllers: [AuditController],
  providers: [AuditService, { provide: AuditRepository, useClass: PrismaAuditRepository }],
})
export class AuditModule {}
