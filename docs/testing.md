# Testing

How CEDI Control is tested, and which tests cover each requirement and business rule. Test names are quoted in their original Spanish wording so they can be found with a text search.

## Test levels

| Level       | Tool                                           | What it covers                                                                                   | Command                    |
| ----------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------- |
| Unit        | Vitest                                         | Shared schemas, services with mocked dependencies, web logic                                     | `npm test`                 |
| Integration | Vitest + real PostgreSQL (`DATABASE_URL_TEST`) | The full API over HTTP, database constraints and permissions, concurrency                        | `npm run test:integration` |
| End-to-end  | Playwright (Chromium) + axe                    | The gatehouse flow in a real browser, roles, sessions, WCAG 2.1 AA accessibility, tablet, keyboard | `npm run test:e2e`         |
| Coverage    | `@vitest/coverage-v8`                          | Unit + integration, with minimum thresholds                                                      | `npm run test:coverage`    |

Integration and end-to-end tests need `npm run db:up`. They use the `cedi_test` database, never the development one, and leave it empty when they finish. The end-to-end suite starts its own API (port 3100) and web app (port 5174), so it does not clash with `npm run dev`, and it runs in a fixed time zone where it is midday, so results do not depend on the time of day.

**Current figures:** 202 unit, 126 integration and 19 end-to-end tests. Coverage: API 98 % of lines and 88 % of branches; web logic 92 % and 90 %; `@cedi/shared` above 95 %. React components are covered by the end-to-end tests. CI fails below the thresholds (API 90 % / 80 %, shared 90 % / 90 %, web 85 % / 85 %).

## Required tests (NFR-8)

| Requirement                                          | Tests                                                                                                                                               |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create a person                                      | `persons.http.int-spec` "registra la persona con la cédula normalizada"; E2E "cédula nueva"                                                         |
| Search for a person                                  | `persons.http.int-spec` "secciones por tipo" (name without accents, ID prefix, company); `persons.service.spec`                                     |
| ID number format and uniqueness                      | `shared/persons.test` (`identificationSchema`); `database-constraints.int-spec` "R13 y D10"; `persons.http.int-spec` "R13"                         |
| Record an entry                                      | `visits.http.int-spec` "ciclo completo", "trabajador externo"; E2E "persona registrada"                                                            |
| Prevent a double entry                               | `visits.http.int-spec` "R1" (five gatehouses at once); `database-constraints.int-spec` "R1"                                                        |
| Registered and unregistered person                   | `visits.http.int-spec` "salida y entrada de una persona registrada", "persona no registrada" (all or nothing); E2E "prellena motivo y área", "cédula nueva" |
| Record an exit                                       | `visits.http.int-spec` "ciclo completo", "D2"; E2E "doble escaneo", "técnico"                                                                      |
| Prevent an exit without an entry                     | `visits.http.int-spec` "R2: no se puede cerrar una visita que ya tiene salida"                                                                      |
| Close the visit correctly                            | `database-constraints.int-spec` "R11 y R12"; `visits.http.int-spec` "D3" (manual close validated and audited)                                       |
| Security cannot use administrative functions         | `auth.http.spec` "autorización por rol"; `audit.http.int-spec` "Seguridad no puede consultar"; `persons.http.int-spec` "Seguridad no puede corregir el nombre"; E2E "Seguridad no ve ni puede abrir la auditoría" |
| Account administration                               | `accounts.int-spec` (create, deactivate, reactivate, reset password against the database); `user-accounts.service.spec`                            |
| A person never has two open visits                   | `database-constraints.int-spec` "R1" (partial index and concurrency); `visits.http.int-spec` "R1"                                                  |

## Business rules and design decisions

| Rule or decision                                     | Tests                                                                                                       |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| R1 one open visit                                    | `database-constraints.int-spec`, `visits.http.int-spec`                                                     |
| R2 no exit without an entry                          | `visits.http.int-spec` "R2"                                                                                 |
| R11 exit after entry · R12 exit author iff exit time | `database-constraints.int-spec`                                                                             |
| R13 unique ID number                                 | `database-constraints.int-spec`, `persons.http.int-spec`, `persons.service.spec`                           |
| R14 deactivated users lose access                    | `auth.http.spec`, `accounts.int-spec`                                                                       |
| R15 last active Administrator                        | `user-accounts.service.spec`, `accounts.int-spec`                                                           |
| R16 / R19 tools only for technicians                 | `shared/visits.test`, `visits.http.int-spec` "R18 y R19"                                                   |
| R17 visits keep type and company                     | `database-constraints.int-spec`, `visits.http.int-spec`, `persons.http.int-spec`, `history.http.int-spec`  |
| R18 fields by person type                            | `shared/visits.test`, `database-constraints.int-spec`, `visits.http.int-spec`, `web/visit-details-input.test` |
| R20 session revocation                               | `accounts.int-spec` "restablecer la contraseña cierra las sesiones", "desactivar y reactivar"              |
| D1 prefilled purpose and area                        | `visits.http.int-spec` "ciclo completo"; E2E                                                                |
| D2 double scan                                       | `visits.http.int-spec` "D2"; E2E                                                                            |
| D3 forgotten visits                                  | `visits.http.int-spec` "D3", `dashboard.http.int-spec`; E2E                                                 |
| D6 the CEDI's day                                    | `clock.spec` (midnight and daylight-saving changes); `visits`, `dashboard`, `history` and `audit` integration tests |
| D9 required company without duplicates               | `shared/persons.test`, `persons.http.int-spec` (including simultaneous creation)                           |
| D10 normalized ID number                             | `shared/persons.test`, `database-constraints.int-spec`                                                      |
| D12 audit log without values, Administrators only    | `audit.http.int-spec`, `persons.http.int-spec`; E2E                                                         |
| D13 who corrects name and ID number                  | `persons.service.spec`, `persons.http.int-spec`, `shared/persons-update.test`                              |
| D15 accent-insensitive search                        | `persons.service.spec`, `persons.http.int-spec`, `history.http.int-spec`                                    |

## Features and quality attributes

| Area                                                            | Tests                                                                                     |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Tools checked on exit (FR-12)                                   | `visits.http.int-spec` "FR-12", `web/use-scan-flow.test`; E2E "técnico"                   |
| Demo access (ADR 0016)                                          | `demo-password.spec`; `demo-setup.int-spec` (one account per role, data by type, consistent visits and audit trail, no duplicates on re-runs, other accounts untouched, refuses production) |
| Production build: web served by the API, health, headers        | `production.http.spec`; `accounts.int-spec` "chequeo de salud"                            |
| Signing out and expired sessions                                | `web/session-state.test`, `web/query-client.test`; E2E "cerrar sesión vuelve al login", "si la sesión vence a mitad del turno" |
| Accessibility (NFR-5)                                           | E2E `3-accessibility` (axe WCAG 2.1 A/AA on every screen), `4-responsive-and-keyboard`    |
| Responsive design (NFR-4)                                       | E2E `4-responsive-and-keyboard` (tablet without overflow, controls ≥ 40 px)               |
| Entry and exit screen fits the window on desktop (FR-8)         | E2E `4-responsive-and-keyboard` "escritorio (1280 × 720)" and "(1920 × 1080)"             |

## Security

Identifiers refer to the findings of the pre-production security review described in [security.md](security.md).

| Finding                                                                  | Tests                                                                                     |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| SEC-01 signing out invalidates the session on the server                 | `auth.http.spec` "SEC-01" (copied cookie → 401)                                           |
| SEC-02 the API runs without admin database privileges                    | `privileges.int-spec` (granted and denied permissions); E2E with the unprivileged user    |
| SEC-03 manual close only for visits from previous days                   | `visits.http.int-spec` "SEC-03"                                                           |
| SEC-04 security events without sensitive data, alert on failure volume   | `security-events.spec`; `security.http.spec` "SEC-04"                                     |
| SEC-05 temporary lockout per email, also for unknown emails              | `login-attempts.spec`; `security.http.spec` "SEC-05"                                      |
| SEC-06 413 for oversized bodies, 400 for malformed JSON                  | `security.http.spec` "SEC-06"                                                             |
| SEC-07 per-user request limit; gatehouses sharing an IP are independent  | `security.http.spec` "SEC-07"                                                             |
| SEC-08 guessable passwords rejected                                      | `shared/auth.test` "SEC-08"                                                               |
| SEC-12 example secrets rejected in production                            | `app-config.spec` "SEC-12"                                                                |
| SEC-13 request logs without query string, parameters or headers          | `request-log.spec`                                                                        |
| I1 only HS256 tokens with the app's issuer and audience                  | `security.http.spec` "I1"                                                                 |
| I3 CSP without `unsafe-inline`                                           | `production.http.spec` "cabeceras de seguridad"                                           |
