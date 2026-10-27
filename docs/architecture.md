# Architecture

How CEDI Control is built to meet the [requirements](requirements.md). The reasoning behind each significant choice is recorded as an ADR in [decisions/](decisions/README.md).

## Overview

```
Browser (React SPA)  ──HTTP + session cookie──▶  NestJS API  ──Prisma──▶  PostgreSQL 17
        │                                             │
        └──────── @cedi/shared: types, enums and Zod schemas used by both ─────┘
```

A TypeScript monorepo with npm workspaces:

| Package           | Responsibility                                                                         |
| ----------------- | -------------------------------------------------------------------------------------- |
| `packages/shared` | Enums, Zod schemas, labels and domain helpers (ID normalization, search text). The single source of validation for web and API. |
| `apps/api`        | REST API (NestJS) and terminal tools (`users`, `demo:setup`, database user).           |
| `apps/web`        | Single-page app (React + Vite) used at the gatehouse.                                   |
| `e2e`             | Playwright tests against a real API, web app and database.                             |

In production a single container runs the API, which also serves the built web app from the same origin, next to PostgreSQL ([ADR 0010](decisions/0010-single-container-deployment.md)).

## Engineering principles

- **Separation of concerns.** Presentation, business logic, data access and authentication live in separate layers. Components never contain business rules.
- **One source of truth.** Types, enums, validation and constants are defined once in `@cedi/shared`; duplicated logic is extracted.
- **Rules in the database too.** Critical rules are enforced with constraints (partial unique index, `CHECK`), not only in code, and migrations are versioned and reproducible.
- **Tested rules.** Every business rule has a test; integration tests run against real PostgreSQL; the gatehouse flow has end-to-end tests. Lint, types or failing tests mean the work is not done.
- **No over-engineering.** No pattern or feature without a real need of the process.
- **Security by default.** Server-side validation with the shared schemas, authorization on every endpoint, parameterized queries, errors as `{ code, message }` without internal details, secrets only in environment variables.

## API

Organized by module: `auth`, `persons`, `companies`, `visits`, `dashboard`, `audit`, `health`, plus cross-cutting `security`, `common` (errors, logging, time, validation) and `config`. Each module follows **controller → service → repository**:

- **Controller:** HTTP, validation of input with the shared Zod schemas, role guards.
- **Service:** use cases and business rules (for example, the entry and exit logic lives in the visits service).
- **Repository:** data access through Prisma; audit entries are written in the same transaction as the change they describe.

Authentication and roles are enforced by global guards: every route requires a session except login, logout and health. The current time comes from an injectable `Clock`, so the rules that depend on time (double scan, forgotten visits, "today") are testable.

### Endpoints

```
POST /auth/login · POST /auth/logout · GET /auth/me
POST /scans {identification, confirmed?}
     → EXIT_REGISTERED | ENTRY_PENDING | PERSON_NOT_FOUND | CONFIRMATION_REQUIRED | PREVIOUS_DAY_VISIT_OPEN
POST /visits · PATCH /visits/:id/close · GET /visits · GET /visits/:id · GET /visits/inside
GET /persons · POST /persons · GET /persons/:id · PATCH /persons/:id
GET /companies · POST /companies
GET /dashboard/summary
GET /audit · GET /audit/actors          (Administrator only)
GET /health
```

Errors always have the shape `{ code, message }`, with messages written for gatehouse staff.

### Scan flow

```
ID number typed (Enter) → POST /scans
 ├─ not registered      → registration form (type → fields for that type) → person + first entry
 ├─ open visit          → automatic exit (if the last operation was < 60 s ago, ask for confirmation)
 ├─ open visit from a previous day → offer to close it with the real exit time, then record the entry
 └─ no open visit       → person record with purpose and area prefilled → Enter → entry recorded
```

## Web app

Organized by feature (`scan`, `dashboard`, `persons`, `history`, `audit`, `auth`, `companies`) with Atomic Design for shared components (atoms → molecules → organisms → templates → pages). The sign-in and entry and exit screens ship in the initial bundle; every other screen is loaded on demand when its route is opened, and libraries are split into their own long-lived chunks (React, TanStack Query, forms). Data comes from TanStack Query, which polls every 10 seconds and refreshes right after each local operation; forms use React Hook Form with the shared Zod schemas. Scanner input sits behind a `ScannerSource` interface — keyboard and keyboard-style scanners today, a camera later without redesigning the flow ([ADR 0006](decisions/0006-scanner-and-scan-operation.md)). Colors, radii and shadows come only from design tokens ([ADR 0011](decisions/0011-design-system.md)).

## Data model

```
users        (id, name, email UQ, password_hash, role, is_active, sessions_valid_from, created_at, updated_at)
companies    (id, name, name_normalized UQ)
persons      (id, full_name, name_normalized, identification UQ, type, company_id FK, created_at, updated_at)
visits       (id, person_id FK, person_type, company_id FK, entry_at, exit_at null,
              entry_by FK users, exit_by FK users null, purpose null, area null)
visit_tools  (id, visit_id FK, name, description null, quantity null)
audit_logs   (id, user_id FK, action, entity, entity_id, changed_fields, created_at)
```

Company 1—N persons; company 1—N visits (the company in effect at entry); person 1—N visits; visit 1—N tools. Users appear only as authors of visits and audit entries. There are no circular relationships, and the visit status is computed (`exit_at IS NULL` means inside), not stored.

Enforced by the database:

| Constraint                                                                   | Rule      |
| ---------------------------------------------------------------------------- | --------- |
| Partial unique index `visits(person_id) WHERE exit_at IS NULL`               | R1        |
| `CHECK (exit_at IS NULL OR exit_at >= entry_at)`                              | R11       |
| `CHECK ((exit_at IS NULL) = (exit_by IS NULL))`                               | R12       |
| Unique, normalized `identification` with a format `CHECK`                     | R13, FR-4 |
| `company_id NOT NULL` on persons and visits                                   | FR-2      |
| Per-type `CHECK` on purpose and area                                          | R18       |

Tools only for technicians (R16, R19) span two tables and are enforced in the visits service. Search uses indexes on `identification`, `company_id` and `type`, trigram indexes (`pg_trgm`) on normalized names, and indexes on visits by person, entry time and company. The API connects with a database role that has no `DELETE` or DDL rights ([ADR 0012](decisions/0012-unprivileged-database-role.md)).

## Technology stack

| Layer      | Choice                                                                     | Why                                                                                   |
| ---------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Runtime    | Node.js ≥ 22.12, strict TypeScript                                         | One language and shared types across web, API and the shared package                  |
| API        | NestJS 11                                                                  | Native modules, dependency injection and role guards                                  |
| Data       | PostgreSQL 17, Prisma 7                                                    | Partial indexes, `CHECK`, trigram search; typed, versioned migrations                 |
| Web        | React 19, Vite 8, React Router 7, TanStack Query, React Hook Form, Tailwind 4 | An internal app needs no SSR; caching with live polling; typed forms               |
| Validation | Zod 4 in `@cedi/shared`                                                    | The same schema validates the form and the API                                        |
| Auth       | argon2id, signed JWT in an `httpOnly` `SameSite=Strict` cookie, one shift long | Immediate deactivation without refresh-token complexity; no OAuth ([ADR 0004](decisions/0004-authentication-and-session.md)) |
| Logging    | nestjs-pino                                                                | Structured logs without sensitive data                                                |
| Testing    | Vitest, Supertest, Playwright, axe                                         | One runner for all packages; integration against real PostgreSQL; accessible E2E      |
| Delivery   | Multi-stage Docker image, GitHub Actions, Dependabot                       | Reproducible image; CI with quality, tests and supply-chain checks                    |

The rationale and rejected alternatives are in [ADR 0001](decisions/0001-technology-stack.md). Exact versions are pinned by `package-lock.json`.

## Design decisions

The original requirements left some points open. These decisions settle them; the larger ones have their own ADR.

| ID  | Topic                         | Decision                                                                                                                                         |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Fast entry vs. per-visit data | Entering the ID shows the person. An external worker is confirmed with one Enter; other types get purpose and area prefilled from their last visit, so one Enter is usually enough. |
| D2  | Accidental double scan        | If the person's previous operation was less than 60 s ago, the opposite operation needs explicit confirmation.                                     |
| D3  | Forgotten visits              | No extra status. Open visits from previous days are highlighted and can be closed with the real exit time (audited); scanning that person again offers to close it first. |
| D4  | Roles                         | An enum (`SECURITY`, `ADMIN`), not a table.                                                                                                       |
| D5  | Visit status                  | Computed from `exit_at`, never stored ([ADR 0003](decisions/0003-computed-visit-status.md)).                                                       |
| D6  | "Today"                       | Timestamps are stored in UTC; the day is computed in the CEDI's time zone (`CEDI_TIMEZONE`), including daylight-saving changes.                   |
| D7  | Search identifier             | The ID number; there is no badge or other code ([ADR 0008](decisions/0008-id-number-identification.md)).                                          |
| D8  | Purpose and area              | Free text with a length limit; no catalogs and no "visit type".                                                                                  |
| D9  | Company                       | Required for every type; created inline with autocomplete and a unique normalized name ([ADR 0009](decisions/0009-fields-by-person-type.md)).     |
| D10 | ID number format              | 4-20 letters and digits after removing spaces, dots and hyphens; no country-specific logic.                                                       |
| D11 | Real time                     | Polling every 10 s plus refresh after local operations ([ADR 0005](decisions/0005-polling-for-live-data.md)).                                     |
| D12 | Audit log content             | Who, action, entity, record, time and the names of changed fields — never their values. Administrators only.                                      |
| D13 | Editing people                | Both roles edit type and company (a type change asks for confirmation); only Administrators correct name and ID number. People with visits are never deleted. |
| D14 | User management               | Terminal commands (`npm run users`, `create-admin`); no screen. The seed contains no accounts or sensitive data.                                  |
| D15 | Name search                   | A normalized column (no accents or punctuation) with a trigram index, so "perez" finds "Pérez".                                                   |
