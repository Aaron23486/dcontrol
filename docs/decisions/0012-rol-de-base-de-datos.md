# 0012 — The API runs with an unprivileged database role

**Status:** APPROVED (2026-10-24, remediation of the security audit, finding SEC-02). Modifies ADR 0010 regarding "migrations on startup".

## Context

The security audit (2026-10-24) confirmed that the API connected to PostgreSQL with the user created by the official image (`POSTGRES_USER`), which is a **superuser**. The same user applied the migrations on startup. Any future flaw in the API (injection, remote execution) would give full control of the database server: deleting or rewriting the audit log, changing the schema or running system commands with `COPY ... TO PROGRAM`.

## Decision

- **Two identities:**
  - **Table owner** (`MIGRATION_DATABASE_URL`): applies the migrations and creates the API user. Only `npm run db:deploy` and `npm run db:migrate` use it.
  - **API user** (`DATABASE_URL`): with login, without admin privileges, a member of the `cedi_app` role.
- **`cedi_app` role** (migration `rol_de_aplicacion`, without login) with only what the operation needs:
  - `SELECT, INSERT` on the six tables.
  - `UPDATE` only on specific columns: password, status and session revocation of `users`; the data of `persons`; `exit_at` and `exit_by` of `visits`.
  - No `DELETE`, `TRUNCATE`, DDL, role creation or access to `_prisma_migrations`.
  - The audit log and a visit's entry, type and company are immutable for the API.
- **`npm run db:deploy`** = `prisma migrate deploy` + `scripts/db-app-user.ts`, which creates or updates the `DATABASE_URL` user with those attributes. It refuses to use the table owner or a privileged user.
- **The image no longer migrates on startup** (changes ADR 0010): the API container does not receive the owner's credentials. In `docker-compose.prod.yml`, a `migrate` service runs `db:deploy` and the app starts when it finishes.
- **Every new migration** that adds a table or column the API writes must include its `GRANT` to `cedi_app`. The E2E tests start the API with an unprivileged user, so a missing `GRANT` makes the scenarios fail.

## Rejected alternatives

- **Keep a single user, but not a superuser:** the table owner can drop the tables and rewrite the audit log; it does not solve the problem.
- **Migrate on startup with both URLs in the container:** the API would have the owner's credentials at hand; a remote execution would read them from the environment.
- **Default privileges (`ALTER DEFAULT PRIVILEGES`):** they would grant automatic permissions on future tables; declaring them in each migration is preferred.

## Consequences

- Development and production need `MIGRATION_DATABASE_URL` in addition to `DATABASE_URL` (`.env.example`).
- On platforms without docker-compose, `npm run db:deploy` is configured as a pre-deploy step (_release command_) with both URLs.
- The integration tests check every granted and denied permission (`privileges.int-spec.ts`).
- The `POSTGRES_USER` user is still a superuser inside the database container: only the migration uses it, and the database port is not published in production.
