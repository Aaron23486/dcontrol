# ADR 0012: The API runs with an unprivileged database role

**Status:** Accepted · 2026-10-24 · Supersedes the migrations-on-startup part of [ADR 0010](0010-single-container-deployment.md)

## Context

A security review I ran before production confirmed that the API connected to PostgreSQL as the user created by the official image (`POSTGRES_USER`), which is a **superuser**, and that the same user applied the migrations at startup. Any future flaw in the API (injection, remote code execution) would have given full control of the database server: deleting or rewriting the audit log, changing the schema, or running system commands through `COPY ... TO PROGRAM`.

## Decision

- **Two identities:**
  - The **table owner** (`MIGRATION_DATABASE_URL`) applies migrations and creates the API user. Only `npm run db:deploy` and `npm run db:migrate` use it.
  - The **API user** (`DATABASE_URL`) can log in, has no admin privileges and is a member of the `cedi_app` role.
- **The `cedi_app` role** (created in a migration, without login) has only what the app needs:
  - `SELECT, INSERT` on the six tables.
  - `UPDATE` only on specific columns: password, status and session revocation on `users`; the editable data on `persons`; `exit_at` and `exit_by` on `visits`.
  - No `DELETE`, `TRUNCATE`, DDL, role management or access to `_prisma_migrations`. The audit log, and a visit's entry, type and company, are immutable for the API.
- **`npm run db:deploy`** runs `prisma migrate deploy` and then creates or updates the `DATABASE_URL` user with those attributes. It refuses to use the table owner or a privileged user.
- **The image no longer migrates on startup:** the API container never receives the owner's credentials. In `docker-compose.prod.yml`, a `migrate` service runs `db:deploy` and the app starts once it finishes.
- **Every new migration** that adds a table or column the API writes must include its `GRANT` to `cedi_app`. The end-to-end tests run the API as an unprivileged user, so a missing grant makes them fail.

## Alternatives considered

- **One user that is not a superuser:** the table owner can still drop tables and rewrite the audit log.
- **Migrating on startup with both URLs in the container:** the API would hold the owner's credentials, readable by any remote code execution.
- **`ALTER DEFAULT PRIVILEGES`:** it would grant permissions on future tables automatically; I prefer to declare them in each migration.

## Consequences

- Development and production need `MIGRATION_DATABASE_URL` in addition to `DATABASE_URL`.
- On platforms without docker-compose, `npm run db:deploy` is configured as a release command with both URLs.
- Integration tests check every granted and every denied permission.
- `POSTGRES_USER` is still a superuser inside the database container; only migrations use it, and the database port is never published in production.
