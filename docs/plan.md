# Technical plan

> **Status: APPROVED (2026-10-23).** D1-D14, R11-R16 and the stack were approved by the project owner.
> Any later change is recorded as an ADR in `docs/decisions/` before it is implemented.
> **Changes approved on 2026-10-23:** ADR 0008 (the ID number identifies the person; users managed from the terminal) and ADR 0009 (fields by person type; company required). They affect D1, D7, D8, D9, D10, D13, D14, R13, R15 and R16-R19.

## 1. Decisions on ambiguities in the spec

| #   | Topic                                | Proposed decision                                                                                                                                                                                                                                                                                         | Status             |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| D1  | Fast entry vs per-visit data         | Entering the ID number shows the person's record. External worker: one Enter confirms. Contractor, technician and visitor: a mini-form with purpose and area (and tools for the technician), prefilled from their last visit, so that one Enter is usually enough.                                          | APPROVED (amended) |
| D2  | Accidental double scan               | If less than 60 s have passed since that person's previous operation, explicit confirmation is requested before recording the opposite operation.                                                                                                                                                       | APPROVED           |
| D3  | Forgotten visits (no exit)           | No new status. Every open visit from a previous day is highlighted. Security or Admin can close it manually by entering the exit time (audited). If the person scans again, they are warned about the pending visit and offered to close it before opening another one.                                  | APPROVED           |
| D4  | "Administer roles"                   | Roles as an enum (`SECURITY`, `ADMIN`). It means assigning a role to a user. No `roles` table.                                                                                                                                                                                                           | APPROVED           |
| D5  | Visit status                         | Not stored. `INSIDE` means `exit_at IS NULL`; the API exposes it as a computed field.                                                                                                                                                                                                                    | APPROVED           |
| D6  | Visit "date"                         | Only `entry_at` and `exit_at`, in UTC. The date is derived with the CEDI's time zone (environment variable).                                                                                                                                                                                              | APPROVED           |
| D7  | Search identifier                    | The person is looked up by their ID number (`identification`); there is no other code (ADR 0008).                                                                                                                                                                                                        | APPROVED (amended) |
| D8  | Purpose and area                     | Free text with a length limit in v1. No catalogs. There is no "visit type" (ADR 0009).                                                                                                                                                                                                                    | APPROVED (amended) |
| D9  | Company                              | Required for all four types (`company_id NOT NULL` in `persons` and `visits`). Companies are created inline with autocomplete and a unique normalized name (ADR 0009).                                                                                                                                     | APPROVED (amended) |
| D10 | Identification (ID number)           | Unique and fixed. Typed with digits, letters and hyphens; stored normalized: uppercase, without spaces, dots or hyphens (so `1-234-567` and `1234567` are the same person). Between 4 and 20 alphanumeric characters after normalization. No country-specific logic.                                        | APPROVED (amended) |
| D11 | Real time                            | Polling every 10 s plus cache invalidation after each local operation. SSE as a future improvement.                                                                                                                                                                                                       | APPROVED           |
| D12 | Audit log                            | Only Admin can view it. It stores user, action, entity, id, date and the names of the modified fields (no values).                                                                                                                                                                                       | APPROVED           |
| D13 | Editing people                       | Security and Admin edit the data that changes (type, company). Only Admin corrects the ID number and name. Every change is audited and a type change asks for confirmation. People with visits are not deleted.                                                                                            | APPROVED (amended) |
| D14 | User management                      | No screen. Accounts are managed from the terminal: `npm run users -- create` (SECURITY or ADMIN role), `list`, `activate`, `deactivate` and `reset-password`. `npm run create-admin` remains available as a shortcut. The seed contains no sensitive data.                                                  | APPROVED (amended) |
| D15 | Searching people by name             | Column `persons.name_normalized` (no accents or punctuation, uppercase), computed by the API with `normalizeSearchText` from `@cedi/shared` and indexed with trigrams. This way "perez" finds "Pérez". The ID number is searched by prefix and the company by its `name_normalized`.                        | APPROVED (Phase 3) |

## 2. Additional business rules (added to R1-R10 of the spec)

| #   | Rule                                                                                                                                                                       | Status             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| R11 | `exit_at >= entry_at`                                                                                                                                                      | APPROVED           |
| R12 | `exit_by` exists if and only if `exit_at` exists                                                                                                                           | APPROVED           |
| R13 | The identification (ID number) is unique                                                                                                                                   | APPROVED (amended) |
| R14 | A deactivated user loses access on the next request                                                                                                                        | APPROVED           |
| R15 | ~~An admin cannot deactivate themselves~~ Not applicable: there is no user management on the web. The `users` command prevents deactivating the last active ADMIN.          | APPROVED (amended) |
| R16 | Only maintenance technicians can have tools associated with the visit                                                                                                      | APPROVED           |
| R17 | Each visit stores the company and person type in effect at the time of entry; changing the person's data does not alter the history                                        | APPROVED           |
| R18 | Contractor, technician and visitor: purpose and area required on every visit. External worker: the visit has no purpose or area (enforced in the database)                 | APPROVED           |
| R19 | Tools are optional for the technician and not allowed for the other types (reinforces R16)                                                                                 | APPROVED           |
| R20 | Changing the password or deactivating an account invalidates its open sessions (`users.sessions_valid_from`, Phase 11)                                                     | APPROVED           |

## 3. Data model (PostgreSQL)

```
users        (id, name, email UQ, password_hash, role, is_active, sessions_valid_from, created_at, updated_at)
companies    (id, name, name_normalized UQ)
persons      (id, full_name, identification UQ, type, company_id FK, created_at, updated_at)
visits       (id, person_id FK, person_type, company_id FK, entry_at, exit_at null,
              entry_by FK users, exit_by FK users null, purpose null, area null)
visit_tools  (id, visit_id FK, name, description null, quantity null)
audit_logs   (id, user_id FK, action, entity, entity_id, changed_fields null, created_at)
```

Relationships: company 1—N persons; company 1—N visits (a copy of the company in effect at entry, R17); person 1—N visits; visit 1—N tools. Users only as authors (visits and audit log). No circular relationships.

Integrity in the database:

- Partial unique index `visits(person_id) WHERE exit_at IS NULL` (R1, even with several concurrent gatehouses).
- `CHECK (exit_at IS NULL OR exit_at >= entry_at)`.
- `CHECK ((exit_at IS NULL) = (exit_by IS NULL))`.
- `company_id NOT NULL` in `persons` and `visits` (D9).
- Per-type field `CHECK` on `visits` (R18): purpose and area present and non-empty except for the external worker, and absent for the external worker.
- `CHECK` on the normalized ID number format (D10).
- R16/R19 (tools only for technicians) is validated in the visits service: it is a cross-table rule.

Search indexes: `persons(identification)`, `persons(company_id)`, `persons(type)`, trigram (`pg_trgm`) on `full_name` and `companies.name_normalized`, `visits(person_id, entry_at DESC)`, `visits(entry_at)`, `visits(company_id)`, partial on open visits, `audit_logs(entity, entity_id)`, `(created_at)`, `(user_id)`.

## 4. Stack (all TypeScript)

| Layer         | Technology                                                                                                                                                       | Reason                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Runtime       | Node.js ≥ 22.12 (22 or 24 LTS), TypeScript 5.9 in `strict` mode                                                                                                  | LTS; a single language across API, web and `shared`. From 22.12 the most common Node version can be used.                  |
| Monorepo      | npm workspaces: `apps/api`, `apps/web`, `packages/shared`                                                                                                        | One clone, one install. `shared` holds enums and Zod schemas (a single source of validation).                              |
| Backend       | NestJS                                                                                                                                                           | Modular, native DI, role guards.                                                                                           |
| ORM           | Prisma                                                                                                                                                           | Versioned, typed migrations. Partial indexes and `CHECK` constraints in SQL inside migrations.                             |
| Database      | PostgreSQL 17                                                                                                                                                    | Partial indexes, `CHECK`, trigram. Local Docker or a managed database.                                                     |
| Frontend      | React + Vite + React Router                                                                                                                                      | Mature; an internal app without SEO needs no SSR.                                                                          |
| UI data       | TanStack Query                                                                                                                                                   | Caching, polling and invalidation after a scan.                                                                            |
| Forms         | React Hook Form + Zod resolver                                                                                                                                   | Reuses the `shared` schemas; dynamic fields by person type.                                                                |
| UI            | Tailwind + Radix/shadcn                                                                                                                                          | Accessibility and keyboard support out of the box.                                                                         |
| Validation    | Shared Zod; in the API a custom `ZodValidationPipe`                                                                                                              | Discriminated union by person type, used in the form and the API.                                                          |
| Auth          | `httpOnly` + `SameSite=Strict` cookie with a signed JWT lasting one shift (12 h, no refresh token), `is_active` and role read from the database on every request, argon2 | Immediate deactivation without the complexity of refresh tokens. No OAuth. Restricted CORS. Login rate limit (`@nestjs/throttler`). |
| Logs          | `nestjs-pino`                                                                                                                                                    | Structured logs without sensitive data.                                                                                    |
| Testing       | Vitest in API, web and `shared` (a single runner); integration with real PostgreSQL (Testcontainers or the docker-compose database); Playwright for e2e          | Validate the partial index and the scan flow.                                                                              |
| DevOps        | docker-compose (database only), GitHub Actions (lint, types, tests), `.env.example`, ESLint + Prettier                                                          | Reproducible setup for a recruiter.                                                                                        |

Major versions pinned in Phase 2: NestJS 11, Prisma 7 (with `@prisma/adapter-pg`), React 19, Vite 7, React Router 7, Zod 4, Vitest 4 (≥ 4.1.12 because of security advisories in earlier versions), ESLint 9. Exact versions are in `package-lock.json`. Updated on 2026-10-26 (Phase 18): Vite 8.

Stack status: APPROVED (see `docs/decisions/0001-stack.md`).

## 5. Architecture

- **Backend by module** (`auth`, `users`, `persons`, `companies`, `visits`, `dashboard`, `audit`): Controller (HTTP, DTO, guard) → Service (use cases and rules) → Repository (data). The entry/exit logic lives in `visits`. Auditing is cross-cutting.
- **Frontend by feature** (`scan`, `persons`, `visits`, `inside`, `users`, `audit`) with Atomic Design. The scanner sits behind a `ScannerSource` interface (keyboard-style scanner and manual input today; camera tomorrow).

## 6. API (summary)

```
POST /auth/login · POST /auth/logout · GET /auth/me
POST /scans {identification} → EXIT_REGISTERED | ENTRY_PENDING | PERSON_NOT_FOUND | CONFIRMATION_REQUIRED
POST /visits · PATCH /visits/:id/close · GET /visits · GET /visits/:id · GET /visits/inside
GET/POST/PATCH /persons · GET /persons/:id
GET/POST /companies
GET/POST/PATCH /users           (ADMIN only)
GET /dashboard/summary
GET /audit                      (ADMIN only)
```

Errors: `{ code, message }`, understandable messages, no internal details.

## 7. Scan flow

```
ID number typed (Enter) → POST /scans
 ├─ ID number not registered → registration form (type → dynamic fields) → person + 1st entry
 ├─ has an open visit → automatic exit (if it was < 60 s ago, asks for confirmation)
 └─ no open visit → person record + prefilled data → Enter → ENTRY recorded
```
