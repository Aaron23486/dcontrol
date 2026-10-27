# Changelog

Notable changes to CEDI Control. Versions follow [Semantic Versioning](https://semver.org/); before 1.0.0 the work is grouped by stage.

## [1.0.1] — 2026-10-27

- **Fixed** local and CI production builds bundling the development builds of React and React Router: the web config read `NODE_ENV=development` from `.env` through Vite's `loadEnv`. The Docker image was not affected.
- **Changed** the web app to load each screen on demand and to split libraries into their own chunks: the initial download drops from 819 kB to about 540 kB (240 kB to about 170 kB compressed), and no chunk exceeds 500 kB.
- **Added** a security policy (`SECURITY.md`) for private vulnerability reports.

## [1.0.0] — 2026-10-27

First release: the complete gatehouse application, hardened after a security review and prepared so anyone can clone, install and evaluate it.

### Release preparation — 2026-10-26 to 2026-10-27

- **Added** `npm run demo:setup`: one demo account per role with generated passwords shown once, and fictitious people, visits and audit entries; refuses to run in production ([ADR 0016](docs/decisions/0016-demo-access.md)).
- **Added** MIT license.
- **Changed** the README and every design document to English; reorganized the documentation into requirements, architecture, ADRs, security and testing.
- **Changed** the People, History and Audit pages to share one `PaginatedResults` component instead of three copies of the same block.
- **Changed** dependencies after reviewing Dependabot's proposals (Vite 8, pino-http 11, nestjs-pino 5, GitHub Actions v7, among others). Framework and tooling majors that must move together (NestJS, TypeScript, Vitest, ESLint, `@types/node`) are now planned upgrades instead of automatic proposals ([ADR 0015](docs/decisions/0015-supply-chain-in-ci.md)).
- **Changed** the whole workspace to a single Vite 8 (Vitest and Tailwind still resolved Vite 7) and `@vitejs/plugin-react` 6.
- **Fixed** end-to-end tests failing when CI ran just after midnight in the CEDI's time zone; the suite now runs in a fixed time zone where it is midday.
- **Fixed** setup issues found by installing from a clean clone: the README uses `npm ci`, so the lockfile is not rewritten, and `.env.example` is in English.

### Security hardening — 2026-10-24 to 2026-10-26

Fixes for the findings of a pre-production security review (no critical or high findings; 4 medium, 9 low, 8 informational). Details in [docs/security.md](docs/security.md).

- **Security** signing out revokes the session on the server, not only in the browser.
- **Security** the API connects with a database role without `DELETE` or DDL rights; migrations run separately as the table owner ([ADR 0012](docs/decisions/0012-unprivileged-database-role.md)).
- **Security** manual closing with a typed exit time is limited to visits from previous days.
- **Security** structured security events, an alert on failed sign-in volume and a temporary lockout per account ([ADR 0013](docs/decisions/0013-security-events-and-lockout.md)).
- **Security** per-user request limits, rejection of guessable passwords, pinned token algorithm, issuer and audience, a CSP without inline styles, request logs without query strings, and development PostgreSQL bound to localhost ([ADR 0014](docs/decisions/0014-hardening-limits-passwords-tokens.md)).
- **Security** clear 413 and 400 responses for oversized or malformed bodies; production refuses to start with example secrets.
- **Security** CI audits dependencies, scans the whole Git history for secrets and pins GitHub Actions by commit; Dependabot proposes weekly updates for review ([ADR 0015](docs/decisions/0015-supply-chain-in-ci.md)).

### Interface redesign — 2026-10-23

- **Changed** to a design system with tokens for colors, radii and shadows, a self-hosted Inter typeface and custom icons ([ADR 0011](docs/decisions/0011-design-system.md)).
- **Changed** the entry and exit screen to fit the window on desktop, with internal scrolling for recent activity.
- **Changed** every module (Inside, History, People, Audit, forms, login and error pages) to the same visual language with shared components.
- **Fixed** text contrast on the new background that fell below WCAG AA.

### First complete version — 2026-10-23

- **Added** entry and exit by ID number, designed for keyboard-style scanners: automatic exit for people inside, registration of new people together with their first entry, confirmation on double scans and handling of forgotten visits from previous days.
- **Added** data by person type, enforced by the database: purpose and area for contractors, technicians and visitors; tools for technicians, which are shown again on exit for checking.
- **Added** the gatehouse dashboard, the Inside view, visit history split by person type with filters, people management with accent-insensitive search, and an audit log for Administrators.
- **Added** internal authentication with two roles, accounts managed from the terminal, and sessions revoked when a password changes or an account is deactivated.
- **Added** unit, integration (real PostgreSQL) and end-to-end tests with accessibility checks, coverage thresholds and CI.
- **Added** a production Docker image where the API also serves the web app, health checks and deployment documentation ([ADR 0010](docs/decisions/0010-single-container-deployment.md)).
- **Changed** identification from badges to the ID number after reviewing how the gatehouse works ([ADR 0008](docs/decisions/0008-id-number-identification.md)), and made the company required for every person type ([ADR 0009](docs/decisions/0009-fields-by-person-type.md)).
