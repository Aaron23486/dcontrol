# Architecture decision records

Each significant decision has a short record with its context, the decision, the alternatives I considered and its consequences. A new decision, or a change to an existing one, gets a record before it is implemented; superseded parts stay visible and point to the record that replaced them.

| ADR                                               | Decision                                                                                                      | Status                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| [0001](0001-technology-stack.md)                  | TypeScript monorepo: NestJS, Prisma and PostgreSQL, React with Vite                                           | Accepted                                |
| [0002](0002-single-open-visit.md)                 | A single open visit per person, enforced by the database                                                      | Accepted                                |
| [0003](0003-computed-visit-status.md)             | Visit status computed from the exit time, never stored                                                        | Accepted                                |
| [0004](0004-authentication-and-session.md)        | Session in an `httpOnly` cookie, one shift long, verified against the database on every request               | Accepted                                |
| [0005](0005-polling-for-live-data.md)             | Live data through 10-second polling                                                                           | Accepted                                |
| [0006](0006-scanner-and-scan-operation.md)        | Scanner behind `ScannerSource` and a single scan operation                                                    | Accepted, amended by 0008               |
| [0007](0007-badge-and-free-text-catalogs.md)      | Free-text purpose and area, company as a table                                                                | Badge part superseded by 0008           |
| [0008](0008-id-number-identification.md)          | Identification by ID number, history with type and company per visit, users managed from the terminal         | Accepted                                |
| [0009](0009-fields-by-person-type.md)             | Fields by person type, enforced by the database; company required                                             | Accepted                                |
| [0010](0010-single-container-deployment.md)       | One container serving API and web app                                                                         | Accepted, migrations part superseded by 0012 |
| [0011](0011-design-system.md)                     | Design tokens, self-hosted Inter, custom icons and a full-window entry and exit screen                        | Accepted                                |
| [0012](0012-unprivileged-database-role.md)        | The API runs with an unprivileged database role; migrations run separately                                    | Accepted                                |
| [0013](0013-security-events-and-lockout.md)       | Security events in the log, with an alert and a temporary lockout per account                                 | Accepted                                |
| [0014](0014-hardening-limits-passwords-tokens.md) | Per-user request limits, guessable-password rejection, strict tokens and CSP; no inactivity timeout           | Accepted                                |
| [0015](0015-supply-chain-in-ci.md)                | Dependency audit, secret scanning, pinned actions and reviewed Dependabot updates                            | Accepted                                |
| [0016](0016-demo-access.md)                       | Reproducible demo access with generated passwords and fictitious data                                         | Accepted                                |
