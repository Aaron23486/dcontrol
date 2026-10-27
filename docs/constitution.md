# Constitution — non-negotiable rules

## Design principles

- **SOLID:** one responsibility per module; dependencies on interfaces; dependency injection; no "god" classes.
- **DRY:** logic duplicated more than twice is extracted. A single source of truth for types, enums, validations and constants (the `shared` package).
- **Separation of Concerns:** UI / API / business logic / data access / authentication kept separate.
- **Atomic Design (UI only):** atoms → molecules → organisms → templates → pages. Components contain no business rules.
- **Clean Code:** small functions and components, clear names, strict typing, no hardcoding, no unresolved TODOs, comments only where they add value.
- **No over-engineering:** no complex patterns or features that do not respond to a real need of the process.

## Security

- Passwords with a secure hash (argon2). Never in plain text.
- Always validate on the server, with shared schemas.
- Role-based authorization on every endpoint (guards). A deactivated user loses access on the next request.
- Parameterized queries (no concatenated SQL). Restricted CORS. Login rate limit.
- Errors shown to the user in the `{ code, message }` format, understandable and without internal details or stack traces.
- Environment variables; `.env.example` without real values. Never commit secrets.
- Logs and the audit log without unnecessary sensitive data.

## Data integrity

- Critical rules are enforced in the database (partial unique indexes, `CHECK`), not only in the code.
- Migrations are versioned and reproducible.

## Testing

- Every critical business rule has a test before it is considered done.
- Integration tests against real PostgreSQL for integrity (single open visit).
- E2E tests of the scan flow.
- A task is not done if lint, types or tests fail.

## Process

- Work in phases, one task at a time, with validation before moving on.
- New decision → written in `spec.md`, `plan.md` or `docs/decisions/` before it is implemented.
- If the code contradicts the spec, one of the two is fixed; the discrepancy is never left in place.
- No changes outside the authorized scope of the task.
- If there is a design flaw or a better solution, say so clearly before carrying it out.
