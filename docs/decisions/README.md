# Decisions (ADR)

One file per important decision. Format: Context → Decision → Consequences.
A new decision, or a change to an existing one, is recorded here **before** it is implemented. File names keep their original Spanish slugs so that existing links stay valid.

| ADR                                        | Decision                                                                                                                              | Origin                     | Status             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------ |
| [0001](0001-stack.md)                      | TypeScript stack: NestJS + Prisma + PostgreSQL + React/Vite                                                                           | plan §4                    | APPROVED           |
| [0002](0002-visita-abierta-unica.md)       | Single open visit enforced in the database                                                                                            | R1, plan §3                | APPROVED           |
| [0003](0003-estado-calculado.md)           | Visit status computed, not stored                                                                                                     | D5, D6                     | APPROVED           |
| [0004](0004-autenticacion.md)              | Session in an `httpOnly` cookie with a shift-long JWT and database verification                                                       | plan §4, R14               | APPROVED           |
| [0005](0005-tiempo-real-polling.md)        | Real time through 10-second polling                                                                                                   | D11                        | APPROVED           |
| [0006](0006-escaner.md)                    | Scanner behind `ScannerSource` and a single `POST /scans` operation                                                                   | D1, D2, plan §7            | APPROVED           |
| [0007](0007-gafete-y-catalogos.md)         | Area, type and purpose as free text (the badge part was superseded by 0008)                                                           | D7, D8                     | APPROVED (amended) |
| [0008](0008-cedula-sin-gafete.md)          | Identification by ID number, no badge; history with company and type per visit; users from the terminal                              | spec §5, §7, §9            | APPROVED           |
| [0009](0009-campos-por-tipo.md)            | Fields by person type; company required; no "visit type"                                                                              | spec §7                    | APPROVED           |
| [0010](0010-despliegue.md)                 | One container with API and web; migrations on startup                                                                                 | spec §6, §30               | APPROVED           |
| [0011](0011-sistema-de-diseno.md)          | Design system: tokens, Inter, custom icons and a full-screen "Ingreso y salida"                                                       | UI redesign                | APPROVED           |
| [0012](0012-rol-de-base-de-datos.md)       | The API runs with an unprivileged database role; migrations run separately as the table owner                                        | SEC-02                     | APPROVED           |
| [0013](0013-eventos-de-seguridad.md)       | Security events in the log with an alert and a temporary per-account lockout                                                          | SEC-04, SEC-05             | APPROVED           |
| [0014](0014-endurecimiento-etapa-3.md)     | Per-user request limit, guessable passwords, strict token and CSP, logs without searches; no inactivity timeout                       | SEC-07..10, SEC-13, I1, I3 | APPROVED           |
| [0015](0015-cadena-de-suministro.md)       | CI with dependency audit, gitleaks over the whole history, actions pinned by commit and Dependabot that only proposes                 | SEC-11                     | APPROVED           |
| [0016](0016-acceso-de-demostracion.md)     | Demo access: `demo:setup` with one account per role, generated passwords shown once and fictitious data; refuses to run in production | PSES 2.0                   | APPROVED           |
