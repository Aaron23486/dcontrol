# 0012 — La API opera con un rol de base de datos sin privilegios

**Estado:** APROBADO (2026-10-24, remediación de la auditoría de seguridad, hallazgo SEC-02). Modifica la ADR 0010 en «migraciones al arrancar».

## Contexto
La auditoría de seguridad (2026-10-24) confirmó que la API se conectaba a PostgreSQL con el usuario que crea la imagen oficial (`POSTGRES_USER`), que es **superusuario**. El mismo usuario aplicaba las migraciones al arrancar. Cualquier falla futura en la API (inyección, ejecución remota) daría control total del servidor de base de datos: borrar o reescribir la auditoría, cambiar el esquema o ejecutar comandos del sistema con `COPY ... TO PROGRAM`.

## Decisión
- **Dos identidades:**
  - **Dueño de las tablas** (`MIGRATION_DATABASE_URL`): aplica las migraciones y crea el usuario de la API. Solo lo usan `npm run db:deploy` y `npm run db:migrate`.
  - **Usuario de la API** (`DATABASE_URL`): con inicio de sesión, sin privilegios de administración, miembro del rol `cedi_app`.
- **Rol `cedi_app`** (migración `rol_de_aplicacion`, sin inicio de sesión) con solo lo que la operación necesita:
  - `SELECT, INSERT` en las seis tablas.
  - `UPDATE` solo en columnas concretas: contraseña, estado y revocación de sesiones de `users`; los datos de `persons`; `exit_at` y `exit_by` de `visits`.
  - Nada de `DELETE`, `TRUNCATE`, DDL, creación de roles ni acceso a `_prisma_migrations`.
  - La auditoría y la entrada, el tipo y la empresa de una visita quedan inmutables para la API.
- **`npm run db:deploy`** = `prisma migrate deploy` + `scripts/db-app-user.ts`, que crea o actualiza el usuario de `DATABASE_URL` con esos atributos. Se niega a usar al dueño de las tablas o a un usuario con privilegios.
- **La imagen ya no migra al arrancar** (cambia la ADR 0010): el contenedor de la API no recibe las credenciales del dueño. En `docker-compose.prod.yml`, un servicio `migrate` corre `db:deploy` y la app arranca cuando termina.
- **Toda migración nueva** que agregue una tabla o columna que la API escriba debe incluir su `GRANT` a `cedi_app`. Las pruebas E2E levantan la API con un usuario sin privilegios, así un `GRANT` faltante hace fallar los escenarios.

## Alternativas descartadas
- **Seguir con un solo usuario, pero no superusuario:** el dueño de las tablas puede borrarlas y reescribir la auditoría; no resuelve el problema.
- **Migrar al arrancar con las dos URL en el contenedor:** la API tendría a mano las credenciales del dueño; una ejecución remota las leería del entorno.
- **Permisos por defecto (`ALTER DEFAULT PRIVILEGES`):** darían permisos automáticos a tablas futuras; se prefiere declararlos en cada migración.

## Consecuencias
- Desarrollo y producción necesitan `MIGRATION_DATABASE_URL` además de `DATABASE_URL` (`.env.example`).
- En plataformas sin docker-compose, `npm run db:deploy` se configura como paso previo al despliegue (*release command*) con las dos URL.
- Las pruebas de integración verifican cada permiso concedido y negado (`privileges.int-spec.ts`).
- El usuario `POSTGRES_USER` sigue siendo superusuario dentro del contenedor de la base: solo lo usa la migración y no se publica el puerto de la base en producción.
