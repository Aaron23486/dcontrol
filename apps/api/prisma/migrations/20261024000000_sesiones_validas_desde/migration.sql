-- Revocación de sesiones: las emitidas antes de `sessions_valid_from` dejan de valer.
-- Se actualiza al restablecer la contraseña o desactivar la cuenta (docs/security.md).
BEGIN;

ALTER TABLE "users" ADD COLUMN "sessions_valid_from" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Las cuentas existentes conservan sus sesiones abiertas: nadie queda fuera por la migración.
UPDATE "users" SET "sessions_valid_from" = to_timestamp(0);

COMMIT;
