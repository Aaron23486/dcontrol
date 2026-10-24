-- SEC-02 (ADR 0012): la API opera con un rol sin privilegios de administración.
-- `cedi_app` no inicia sesión: agrupa los permisos. El usuario con contraseña de la API
-- (el de DATABASE_URL) lo crea `npm run db:deploy` como miembro de este rol.
-- Manual: Prisma no genera permisos. Toda tabla o columna nueva que la API escriba
-- necesita su GRANT en la migración que la crea.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cedi_app') THEN
    CREATE ROLE cedi_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO cedi_app;

-- Lectura e inserción donde la operación lo necesita. Sin DELETE ni TRUNCATE en ninguna tabla.
GRANT SELECT, INSERT ON users, companies, persons, visits, visit_tools, audit_logs TO cedi_app;

-- Actualización solo de las columnas que la API modifica:
-- cuentas (contraseña, estado, revocación de sesiones), datos de la persona y la salida de una visita.
-- La entrada, el tipo y la empresa de una visita y toda la auditoría quedan inmutables.
GRANT UPDATE (password_hash, is_active, sessions_valid_from, updated_at) ON users TO cedi_app;
GRANT UPDATE (full_name, name_normalized, identification, type, company_id, updated_at) ON persons TO cedi_app;
GRANT UPDATE (exit_at, exit_by) ON visits TO cedi_app;

COMMIT;
