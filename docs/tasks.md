# Tasks by phase

Update when closing each phase or task. Do not move to the next phase without approval.

## Phase 1 — Analysis ✅ APPROVED (2026-10-23)

- [x] Review the requirements and detect ambiguities
- [x] Propose architecture, data model, flows and stack (`docs/plan.md`)
- [x] Approve D1-D14, R11-R16 and the stack (`plan.md`)
- [x] Create `docs/decisions/` with a short ADR per important decision (0001-0007)

## Phase 2 — Project foundation ✅ APPROVED (2026-10-23)

- [x] Monorepo, configuration, lint, types
- [x] docker-compose (database), `.env.example`
- [x] Prisma: schema, migrations (partial index and CHECK in SQL)
- [x] Authentication, roles (guards), seed, `create-admin`
- [x] Tests: role-based authorization, password hashing
- [x] Fill in the "Comandos" (commands) section in `CLAUDE.md`
- [x] Minimal web app: login, session and protected route
- [x] CI on GitHub Actions (formatting, lint, types, tests, integration, build)
- [x] `npm run test:integration` against PostgreSQL 17 in Docker: 11/11, including R1 concurrency
- [x] `db:up` → `db:deploy` → `db:seed`
- [x] `create-admin` → login in the web app (verified by the owner on 2026-10-23)
- [x] No drift: `prisma migrate diff` between the database and the schema is empty (it does not drop the partial index or the CHECKs)

### Requirement changes (2026-10-23)

**ID number without a badge (ADR 0008)**

- [x] Integrated into the spec (§5, §7, §9), the plan (D7, D10, D13, D14, R13, R15, R17) and ADR 0008
- [x] Migration `cedula_sin_gafete`: `badge_code` removed, the ID number normalized with a CHECK, and visits store `person_type` and `company_id`
- [x] `normalizeIdentification` / `identificationSchema` in `@cedi/shared`, with tests
- [x] User management from the terminal (`npm run users`), with the last-active-ADMIN rule tested

**Fields by person type (ADR 0009)**

- [x] Spec §7: per-type data table. Company required for everyone; purpose and area required for contractor, technician and visitor; tools optional and only for technicians; no "visit type". Spec without mentions of the badge.
- [x] Plan: D1, D8 and D9 amended; new R18 and R19
- [x] Migration `campos_por_tipo`: `company_id NOT NULL`, `visit_kind` removed, `CHECK visits_fields_by_person_type`
- [x] `personSchema`, `visitDetailsSchema` (strict discriminated union by type), `PERSON_TYPE_LABEL` and `VISIT_FIELDS_BY_TYPE` in `@cedi/shared`
- [x] Integration 21/21, unit 63/63, no drift. The integration tests leave `cedi_test` empty when they finish.

## Phase 3 — People ✅ APPROVED (2026-10-23)

- [x] People view split by type (External workers, Contractors, Maintenance / Technicians, Visitors), each section with its columns (purpose, area and tools of the last visit, according to the type)
- [x] Register, search (ID number by prefix, name without accents, company) and edit people; pagination; search and page in the URL
- [x] Companies with autocomplete; inline creation without duplicates (`POST /companies` returns the existing one)
- [x] Detail with the visit history (type, company, purpose, area and tools of each visit, R17)
- [x] ID number and name editable only by ADMIN; type and company by both roles; a type change asks for confirmation; everything audited with field names (D12, D13)
- [x] D15: `persons.name_normalized` column with a trigram index (migration `nombre_normalizado`, inside a transaction)
- [x] Validations with the shared `personSchema` / `updatePersonSchema`
- [x] Tests: service unit tests (permissions, changed fields, duplicate ID number, non-existent company), HTTP against PostgreSQL (registration, sections, search, pagination, detail, editing by role, audit log) and web logic (`changesBetween`)
- [x] Verified in the browser as a guard (desktop and mobile)
- [x] Fixed during the phase: a bug in the regular expression that joined spaces in the name (it removed the letter "s"); stale results in the company autocomplete; `npm run users` with piped input

## Phase 4 — Entry and exit ✅ APPROVED (2026-10-23)

- [x] Main entry and exit screen: focused ID-number field, Enter submits, large "ENTRY / EXIT recorded" notice, the cursor returns to the field on its own
- [x] `ScannerSource` (contract) with `ManualEntryScanner` (keyboard; also works for a keyboard-style scanner)
- [x] `POST /scans {identification, confirmed}`: new person, automatic exit, pending entry, double scan (D2) and a visit from a previous day (D3, day according to the CEDI's time zone)
- [x] `POST /visits`: entry of an existing person, or a new person + first entry in a single transaction
- [x] `PATCH /visits/:id/close`: manual close of a forgotten visit with the real time (validated and audited)
- [x] Visit form according to the type, with purpose and area prefilled from the previous visit (D1); tools optional and only for technicians
- [x] Injectable clock (`Clock`) to test D2 and D3; auditing of entry, exit and manual close
- [x] Tests: double entry (including concurrency from 5 gatehouses), exit without entry (R2), correct close, registered and unregistered person, all or nothing when registering a new person, R17, R18, R16/R19, D1, D2, D3 and midnight in the CEDI's time zone
- [x] Verified in the browser: contractor (entry, double scan, exit), new technician with tools, forgotten visit closed and new prefilled entry
- [x] Usability adjustments: the confirmation dialog focuses "Cancelar" (an accidental Enter does not confirm); registering a new person requires choosing the type explicitly and starts at the name
- [ ] Playwright E2E of the scan flow (planned for Phase 9)

## Phase 5 — Dashboard ✅ APPROVED (2026-10-23)

- [x] Home = the gatehouse dashboard: entering the ID number is still the main action; below it, today's indicators, people inside (the first 8) and recent activity (spec §14)
- [x] Indicators: inside now (main number), entries today, exits today and visits without an exit from previous days (amber with icon and text only if there are any, D3)
- [x] "Dentro" (inside) view (spec §17): filter by type with counts, search by name or ID number, entry time, time inside, forgotten visits highlighted and "Cerrar visita" (close visit) with the real time (D3)
- [x] `GET /dashboard/summary` and `GET /visits/inside`; "today" starts at midnight in the CEDI's time zone (`startOfDay`, handles daylight-saving changes, D6)
- [x] Refresh every 10 s and immediately after each local operation (D11)
- [x] `Clock` moves to a global module (`common/time`) shared by scanning and the dashboard
- [x] Tests: midnight and daylight-saving changes (unit), daily counts with an entry at 23:30 local time, "inside" order, recent activity, refresh after an exit and access without a session (integration), filter and durations (web)
- [x] Verified in the browser: dashboard, refresh from another session in ≤ 10 s, "Dentro" view, closing a forgotten visit, mobile without overflow

## Phase 6 — History ✅ APPROVED (2026-10-23)

- [x] "Historial" (history) section split by type (ADR 0009), each tab with its columns: person, company, date, entry, exit, duration, status; purpose and area according to the type; tools for technicians
- [x] Filters in one row: shortcuts Today / Last 7 days / This month / All, from-to range, status (inside / exit recorded) and search by name, ID number or company; today's visits by default; everything in the URL
- [x] `GET /visits` (paginated) and `GET /visits/:id`; days are counted in the CEDI's time zone (`startOfLocalDate`, D6); the searched company is each visit's (R17)
- [x] Visit detail: type and company at that moment, purpose, area, tools, who recorded the entry and the exit, duration; link to the person's full history (also from their record)
- [x] `GET /visits/inside` is registered before `GET /visits/:id` (module order, with a test)
- [x] Normalized search shared between people and history (`searchTermsOf`)
- [x] Tests: filters by type, CEDI days with an entry at 23:30, status, each visit's company, name without accents, ID-number prefix, pagination, detail, validation and 404 (integration); ranges and filters in the URL (web); local days (unit)
- [x] Verified in the browser, including mobile; the header on small screens was fixed (the menu moves to its own row and "Cerrar sesión" stays visible)

## Phase 7 — Tools ✅ APPROVED (2026-10-23)

Already done in earlier phases: recording on entry, only for technicians (Phase 4, R16/R19) and lookup in history and detail (Phase 6).
Scope approved on 2026-10-23: **check on exit**. Ruled out for now: tools in "Dentro", search by tool, adding tools to an open visit.

- [x] When a technician's exit is recorded, the notice shows the tools they came in with so they can be checked (no additional form, spec §11): amber box with icon and text
- [x] `formatToolLabel` shared between the notice and the history ("Taladro ×2 · inalámbrico")
- [x] Tests: the exit returns the tools (integration), the notice includes them and the formatting (web)
- [x] Verified in the browser: technician entry with 2 tools → exit with D2 confirmation → notice with the list

## Phase 8 — Audit log ✅ APPROVED (2026-10-23)

- [x] Cross-cutting recording (since Phases 3-4): creating and changing people with field names, entries, exits and manual closes, in the same transaction as the operation (D12: never values)
- [x] `GET /audit` and `GET /audit/actors` only for ADMIN (`@Roles` on the whole class); filters by CEDI days, action, user and record
- [x] Each entry shows which person it was about (for visits, the person and the entry time), resolved in two queries
- [x] Actions, entities and field names in `@cedi/shared`, with Spanish labels
- [x] "Auditoría" view only for Administrators (menu and route); "Ver auditoría de esta persona" (see this person's audit log) link on their record
- [x] Date shortcuts shared between history and audit log (`lib/date-range`, `DateRangeFilter`)
- [x] Tests: 403 for Security, order and content, no stored values, filters by action, user, record and day (integration); filters in the URL (web)
- [x] **Fixed:** on sign-out the screen did not redirect to the login and kept showing the loaded data (`queryClient.clear()` disconnected whoever was listening to the session)
- Out of scope (ADR 0008): account changes with `npm run users` are not in the audit log because no app user makes them

## Phase 9 — Testing ✅ APPROVED (2026-10-23)

- [x] Traceability matrix from spec §34 and the rules (R1-R19, D1-D15) to tests: `docs/testing.md`
- [x] Gaps covered: user accounts against the real database (create, R14, R15, reset password) and companies created at the same time from several gatehouses
- [x] Coverage with `@vitest/coverage-v8` and thresholds: API 97 % lines / 86 % branches (unit + integration), `shared` 95 %, web logic 89 % / 91 %; new tests for `http.ts` and local dates
- [x] Playwright E2E (9 scenarios): new ID number, double scan, prefill, tools on exit, forgotten visit, history, Security without the audit log, audit log as Admin, sign-out. Own API on :3100 and web on :5174; test database prepared and emptied on each run
- [x] CI: `test:coverage` (unit + integration with thresholds) and E2E on Chromium, with the Playwright report if they fail
- [x] Dependencies: security advisory in `multer` (through `@nestjs/platform-express`) resolved with `overrides` to 2.5.0; 0 vulnerabilities
- Note about the local machine: the Chromium downloaded by Playwright does not start on this Windows machine ("side-by-side configuration is incorrect"); `E2E_BROWSER_CHANNEL=chrome` in `.env` uses the installed Chrome. CI uses Playwright's Chromium.

## Phase 10 — Final UI/UX ✅ APPROVED (2026-10-23)

- [x] WCAG 2.1 A/AA accessibility checked with axe on every screen (login, 8 internal screens, new person, confirmation): no issues; kept as a permanent e2e test
- [x] Common states `LoadingState`, `ErrorState` (with "Reintentar", retry) and `EmptyState` on the 8 screens
- [x] Session expired or account deactivated mid-shift → login with the notice "Tu sesión terminó" (your session ended); retries only on connection drops or server failures
- [x] "Not found" page and general error screen without technical details (spec §26)
- [x] Optional scan sound (spec §25): different tones for entry, exit and error; "Sonido" (sound) button remembered in the browser
- [x] Buttons and fields at least 40 px; "Saltar al contenido" (skip to content); a tab title per screen
- [x] Tablet (768 px): header on one line; **fixed** a horizontal page overflow caused by the tables' hidden header
- [x] Tests: axe, tablet without overflow or small controls, keyboard, titles, expired session and 404 (e2e, 17 in total); query client, sound, sections and session notice (web)

## Phase 11 — Production ✅ APPROVED (2026-10-23)

- [x] ADR 0010: one container; the API serves the built web app (same origin), migrations on startup, `GET /api/health`, `TRUST_PROXY`, port from `API_PORT` or `PORT`
- [x] Multi-stage `Dockerfile` (unprivileged user, healthcheck) and `docker-compose.prod.yml`; **tested in Docker**: migrations from scratch, `create-admin` inside the container, health, login with a `Secure` cookie and the web app in the browser
- [x] Security review (`docs/security.md`): public endpoints, SQL, validation, secrets, headers, dependencies (0 vulnerabilities)
- [x] **Fixed:** resetting the password or deactivating an account did not close open sessions → `users.sessions_valid_from` and a version in the session (R20, migration `sesiones_validas_desde`)
- [x] Production variables documented; optional variables left empty in `.env` count as undefined
- [x] Screenshots generated with Playwright (`npm run screenshots`, test data) in `docs/screenshots/`
- [x] README with every section of spec §31
- [x] CI also builds the Docker image
- [x] Tests: web served by the API, /api routes, cache, health 503/200, headers, session revocation, empty variables
- Pending for the owner: create the git repository, publish it on GitHub and choose the deployment platform (the image works on any that accepts Docker)

## Phase 12 — Interface redesign (ADR 0011) ✅ APPROVED (2026-10-23)

- [x] ADR 0011 and spec §14, §27: design system and a full-screen "Ingreso y salida" on desktop
- [x] Color, radius and shadow tokens in `index.css`; self-hosted Inter; custom SVG icons
- [x] Base components restyled (`Button`, `Badge`, `Input`, `Select`, `Alert`, `StatTile`, states, dialog, date filters) and a new `Card`
- [x] Horizontal top bar with brand, underlined active tab and the session's real user
- [x] "Ingreso y salida" according to the approved image: scanning with an illustration, 4 indicators with icons, "Personas dentro" and "Actividad reciente" with internal scroll; no page scroll at 1280 × 720, 1366 × 768 and 1920 × 1080
- [x] **Fixed:** the new background left the `slate-500` gray below AA contrast (history tabs); the `ink-muted` token is used
- [x] Tests: e2e without page scroll at 1280 × 720 and 1920 × 1080 (19 in total)
- [x] "Ingreso y salida" approved by the owner
- [x] New shared components: `PageHeader`, `SegmentedControl`, `SearchInput` and `DataTable` (`Th`, `Td`)
- [x] Dentro: header, filter by type with counts, search with a magnifier and the shared table inside a card; "Cerrar visita" unchanged
- [x] Historial: tabs by type, filters (dates, status, search) in a compact bar, shared table and pagination; visit detail with cards
- [x] Dentro and Historial approved by the owner
- [x] Personas: header with "Registrar persona" (register person), tabs, search and shared table; record with "Datos" (data) and "Visitas recientes" (recent visits) cards; registration in a card
- [x] Forms: required-fields notice, two columns when there is room (container query), errors under each field; new-person flow with "Paso 1 de 2" and "Paso 2 de 2" (step 1/2 of 2); forgotten visit with an amber notice and icon. Fields unchanged
- [x] Auditoría: filter bar (dates, action, user) and shared table; each action with an icon and its label
- [x] Login, "Página no encontrada" (page not found), general error and permission notice with the same system; no color left outside the tokens
- [x] README screenshots regenerated (`npm run screenshots`)
- [x] Owner's final review: redesign approved

## Phase 13 — Security remediation, Stage 1 ✅ APPROVED (2026-10-24)

Findings of the 2026-10-24 security audit (4 medium, 9 low, 8 informational; no critical or high).

- [x] SEC-01: signing out revokes the session on the server (`sessions_valid_from`); a copied cookie stops working
- [x] SEC-02: `cedi_app` role without DELETE, TRUNCATE or DDL; API user created by `npm run db:deploy`; migrations run separately as the table owner; the image no longer migrates on startup (ADR 0012)
- [x] SEC-03: manual close only applies to visits from previous days (D3); today's exit is recorded by scanning
- [x] Tests: SEC-01 (HTTP), SEC-02 (permissions and API user, integration; E2E with the unprivileged user), SEC-03 (integration)
- [x] **Tested in Docker** (isolated project): `migrate` applies the 6 migrations and creates the API user; the app only receives that user; `create-admin` inside the container; login with a `Secure` cookie; logout invalidates the copied cookie; the API user cannot delete the audit log; running `migrate` again does not fail
- [x] Owner's review: approved and merged into `main` (pull request #2)

## Phase 14 — Security remediation, Stage 2 ✅ APPROVED (2026-10-25)

- [x] SEC-04: security events in the structured log (logins, lockouts, logout, rejected sessions, denied access, limits) and a `security.alert` alert on failure volume (ADR 0013)
- [x] SEC-05: temporary lockout per email after 5 consecutive failures (15 min), including for non-existent emails (ADR 0013)
- [x] SEC-06: 413 for an oversized body and 400 for malformed JSON, instead of 500
- [x] SEC-12: the API refuses to start in production with the example secrets; `e2e:prepare` refuses to run in production; production secrets guide in `docs/security.md`
- [x] SEC-12 in development: test accounts deactivated, `DEV_*` variables removed, and `JWT_SECRET` and the PostgreSQL owner's password rotated (2026-10-24)
- [x] Owner's review: approved and merged into `main` (pull request #3)

## Phase 15 — Security remediation, Stage 3 ✅ APPROVED (2026-10-26)

First unit of the PSES 2.0 plan (approved on 2026-10-25). Decisions in ADR 0014.

- [x] SEC-07: request limit on the whole API per user (or per IP without a session); the login limit stays separate
- [x] SEC-08: easy-to-guess passwords rejected in `npm run users` and `create-admin`
- [x] SEC-09: accepted and documented risk (no inactivity timeout; see ADR 0014)
- [x] SEC-10: development PostgreSQL only on `127.0.0.1`
- [x] SEC-13: request logs without query string, parameters or headers
- [x] I1: HS256 token with required issuer and audience
- [x] I3: CSP without `unsafe-inline`
- [x] Owner's review: approved and merged into `main` (pull request #4)

## Phase 16 — Supply chain in CI (SEC-11) ✅ APPROVED (2026-10-26)

Second unit of the PSES 2.0 plan. Decisions in ADR 0015.

- [x] `supply-chain` job: `npm audit --audit-level=high` and gitleaks over the whole history (0 findings in the current 10 commits)
- [x] GitHub Actions pinned by commit and `permissions: contents: read`
- [x] Weekly Dependabot (npm and actions) that only proposes PRs
- [x] Workflow validated with actionlint
- [x] Owner's review: merged into `main` (pull request #5)
- Recommended to the owner: enable "Secret scanning" and "Push protection" on GitHub (Settings → Code security)

## Phase 17 — Shared paginated results (DRY) ✅ APPROVED (2026-10-26)

Third unit of the PSES 2.0 plan. No behavior or visual changes.

- [x] `PaginatedResults` organism (error with retry, loading, empty, count, table and pagination) used by People, History and Audit, which repeated the same block
- [x] `formatCount` for the singular or plural count, with its test
- [x] Verified: types, lint, web tests, E2E, and screenshots regenerated and compared pixel by pixel (only the dates and times of the test data change; the original screenshots are kept)
- [x] Owner's review: approved and merged into `main` (pull request #14)

## Phase 18 — First Dependabot updates ✅ APPROVED (2026-10-26)

Fourth unit of the PSES 2.0 plan. Review of each PR (compatibility, CI, risk) and adjustment of the rules (ADR 0015).

- [x] Merged into `main` with green CI: actions `checkout`, `setup-node` and `upload-artifact` v7 (#6, #7, #8); minor and patch group: argon2 0.45, express 5.3, react-hook-form 7.91, eslint-plugin-react-refresh 0.5 (#15); pino-http 11 with pino 10 (#12); Vite 8 (#10)
- [x] Closed: `@nestjs/platform-express` 12 alone (#13: the API does not start with the rest of NestJS on 11) and `@types/node` 26 (#11: does not match Node 22)
- [x] `dependabot.yml`: `nestjs` group for `@nestjs/*` and ignore major versions of `@types/node`
- [x] Verified on `main` after merging them: `npm ci`, formatting, lint, types, build, `npm audit` (0 vulnerabilities), 199 unit, 119 integration, E2E 19 (1 skipped) and screenshots regenerated with Vite 8 (only the dates and times of the test data change; the originals are kept)
- Pending item found: `pg` deprecation warning ("client.query() when the client is already executing a query"), which will stop working in pg 9
- [x] Owner's review: approved and merged into `main` (pull request #16)

## Phase 19 — Demo access (`demo:setup`) ✅ APPROVED (2026-10-27)

Fifth unit of the PSES 2.0 plan. Decision in ADR 0016.

- [x] `npm run demo:setup`: one account per role in `@demo.cedi.test` with a generated password shown once (renewed on re-runs); 10 people of the four types and 14 visits (inside, history, forgotten visit, manual close, technician with tools) with their audit trail; refuses to run in production; only inserts and does not duplicate
- [x] Fictitious companies shared with `db:seed` (`scripts/lib/demo-companies.ts`)
- [x] Tests: `demo-password.spec` (3) and `demo-setup.int-spec` (7), recorded in `docs/testing.md`
- [x] Manual check: run on the development database (without touching the existing account) and signed in through the browser with both accounts (dashboard with people inside and the forgotten visit; Audit log with 37 entries)
- [x] Owner's review: approved and merged into `main` (pull request #22)

## Phase 20 — Second Dependabot round ✅ APPROVED (2026-10-27)

Sixth unit of the PSES 2.0 plan. Decisions in ADR 0015.

- [x] Merged into `main` with green CI: nestjs-pino 5 (#19; supports NestJS 11 and 12) and concurrently 10 (#21)
- [x] Closed: TypeScript 7 (#17: `npm ci` fails, typescript-eslint does not support it yet) and NestJS 12 piece by piece (#18 `@nestjs/common`, #20 `@nestjs/core`: the API does not start)
- [x] `dependabot.yml`: major versions of `@nestjs/*` and `typescript` are ignored (in addition to `@types/node`); the `nestjs` group, which did not prevent the split PRs, is removed
- [x] Verified on `main` after merging them: `npm ci`, lint, types, build, `npm audit` (0 vulnerabilities), 202 unit, 126 integration, E2E 19 (1 skipped) and `npm run dev` starts
- Pending item found: Vite 8 warns that `optimizeDeps.esbuildOptions` is deprecated (set by a plugin; it does not affect the build)
- [x] Owner's review: approved and merged into `main` (pull request #23)

## Phase 21 — README and license in English ✅ APPROVED (2026-10-27)

Seventh unit of the PSES 2.0 plan.

- [x] README in English with the 17 sections of the portfolio standard, the same content, a glossary of the (Spanish) interface terms, screenshots in workflow order and the real repository URL
- [x] Figures measured on 2026-10-27: 347 tests (202 unit, 126 integration, 19 E2E); coverage API ≈ 98 % of lines, web logic ≈ 92 %
- [x] MIT license (Aaron23486) and `license` field in the packages
- [x] Verified: the README's 24 links and images point to existing files; `format:check`; `npm ci`
- The documents in `docs/` were still in Spanish; translated in Phase 24
- [x] Owner's review: approved and merged into `main` (pull request #24)

## Phase 22 — E2E tests independent of the time of day ✅ APPROVED (2026-10-27)

Eighth unit of the PSES 2.0 plan.

- [x] Cause: the CI run of #23 started at 00:03 in the CEDI's time zone; the E2E data created "a few minutes ago" fell on the previous day and 3 scenarios failed although the app was correct (re-running the job away from midnight passed)
- [x] Fix: the E2E config picks a fixed `Etc/GMT±N` zone where it is midday, computed once and shared by the API, the test data and the browser; `E2E_TIMEZONE` forces a zone
- [x] Reproduced before the fix at local midnight (`E2E_TIMEZONE=Etc/GMT+7` at 07:00 UTC: the same scenarios failed) and verified after it: format, lint, types, build, 202 unit, 126 integration, E2E 19 (1 skipped)
- [x] Owner's review: approved and merged into `main` (pull request #32)

## Phase 23 — Third Dependabot round ✅ APPROVED (2026-10-27)

Ninth unit of the PSES 2.0 plan. Decisions in ADR 0015.

- [x] Merged into `main` with green CI: @hookform/resolvers 6 (#25), globals 17 (#26), @types/supertest 7 (#28)
- [x] Closed: @vitest/coverage-v8 5 alone (#27: must share Vitest's major) and ESLint 10 (#29: requires Node 22.13 and leaves @eslint/js on v9)
- [x] `dependabot.yml`: major versions of `vitest`, `@vitest/*`, `eslint` and `@eslint/js` are also ignored
- [x] Owner's review: approved and merged into `main` (pull request #31)

## Phase 24 — Spec-driven documentation in English 🔄 IN REVIEW

Tenth unit of the PSES 2.0 plan.

- [x] `spec.md` translated faithfully, with the same structure (93 headings, 325 bullets, 61 numbered steps; pull request #30)
- [x] `plan.md`, the 16 ADRs and their index, `constitution.md`, `security.md`, `testing.md` and this file translated; same decisions, rules, identifiers, dates and statuses
- [x] ADR file names keep their Spanish slugs and test names keep their original wording, so links and searches still work
- [x] New `docs/README.md`: the role of each document in the process
- [x] Verified: every relative link in `README.md` and `docs/` points to an existing file; no untranslated text outside quoted UI labels, test names and file names
- [ ] Owner's review
