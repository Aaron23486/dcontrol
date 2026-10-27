# ADR 0016: Demo access with `npm run demo:setup`

**Status:** Accepted · 2026-10-26

## Context

To try the app, someone had to create an administrator with `create-admin`, invent people and record entries one by one, and the Inside, History and Audit screens started empty. I wanted anyone evaluating the project to get a realistic, working installation without depending on me.

Two existing rules stood in the way: the seed creates no accounts, and passwords are never printed.

## Decision

- A local command, **`npm run demo:setup`**, run after `db:deploy`:
  - **One account per role** in the reserved `@demo.cedi.test` domain: `seguridad@demo.cedi.test` (Security) and `admin@demo.cedi.test` (Administrator).
  - **Generated passwords** (`crypto.randomInt`, 16 random characters without ambiguous ones) that meet the password rules. They are **printed once** and never written to a file. Running the command again issues new passwords for those two accounts and reactivates them if needed.
  - **Fictitious data:** 10 people of the four types with only the data their type allows, visits open and closed today and on previous days, a forgotten visit from yesterday, one closed manually by the administrator, a technician inside with tools, and the audit trail for all of it. Times are computed from the moment the command runs, in `CEDI_TIMEZONE`.
- **Safeguards:** it refuses to run with `NODE_ENV=production`; it only inserts, within the API's database permissions; the data is created once (no duplicates on later runs); accounts outside `@demo.cedi.test` are never touched.
- The exception to "passwords are never printed" applies **only** here and only to those two accounts. `create-admin`, `npm run users` and the seed are unchanged.
- The fictitious companies are shared with the seed.

## Alternatives considered

- **Fixed passwords in the README:** anyone reading the repository could sign in to an installation that kept them.
- **Prompting for passwords like `create-admin`:** friction with no benefit on a local demo database.
- **Creating the data through the API:** it would require the app running and could not date visits in the past.

## Consequences

- Evaluating the project takes `db:up`, `db:deploy` and `demo:setup`, then signing in with either role.
- Demo visits age: running the command on a later day does not recreate them (nothing is duplicated or deleted).
- A production installation never has demo accounts.
