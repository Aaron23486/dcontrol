import { AuditAction, AuditEntity } from '@cedi/shared';
import type { Prisma } from '../generated/prisma/client';

export { AuditAction, AuditEntity };

export interface AuditEntry {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  /** Nombres de los campos modificados, nunca sus valores (D12). */
  changedFields: string[];
}

/** Registra una entrada de auditoría dentro de la misma transacción que el cambio. */
export async function recordAudit(tx: Prisma.TransactionClient, entry: AuditEntry): Promise<void> {
  await tx.auditLog.create({ data: entry });
}
