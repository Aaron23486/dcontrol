# 0016 — Demo access: `npm run demo:setup`

**Status:** APPROVED (2026-10-26, PSES 2.0 portfolio plan).

## Context

To try the app, an evaluator had to create the administrator with `create-admin`, invent people and record entries one by one; the Inside, History and Audit screens started empty. The portfolio standard requires reproducible demo access that does not depend on the author.

Two existing rules prevented it: the seed creates no users (D14) and passwords are never printed (`npm run users`).

## Decision

- Local command **`npm run demo:setup`**, after `db:deploy`:
  - **One account per role** in the reserved `@demo.cedi.test` domain: `seguridad@demo.cedi.test` (SECURITY) and `admin@demo.cedi.test` (ADMIN).
  - **Generated passwords** with `crypto.randomInt` (16 random characters, no ambiguous ones) that meet the new-password rule. They are **printed only once** in the terminal and never stored in a file. Running the command again generates new passwords for those two accounts (and reactivates them if they were deactivated).
  - **Fictitious data:** 10 people of the four types with only the data of their type (spec §7), open and closed visits today, previous days, a forgotten visit from yesterday (D3), another closed manually by the administrator, a technician inside with tools, and the audit trail of all of it. Times are computed from the moment it runs, in `CEDI_TIMEZONE`.
- **Safeguards:** refuses `NODE_ENV=production`; only inserts (respects the ADR 0012 permissions); the data is created only once (if any `DEMO…` person already exists, nothing is duplicated); accounts outside `@demo.cedi.test` are never touched.
- The exception to "passwords are never printed" applies **only** to `demo:setup` and those two accounts. `create-admin`, `npm run users` and the seed do not change.
- The fictitious companies are shared with the seed (`scripts/lib/demo-companies.ts`).

## Rejected alternatives

- **Fixed passwords documented in the README:** anyone reading the repository could sign in to an installation that keeps them.
- **Asking for the passwords like `create-admin`:** adds friction for the evaluator with no benefit on a local demo database.
- **Inserting the data through the API (HTTP):** it would require the app to be running and does not allow dating visits on previous days.

## Consequences

- An evaluator runs `db:up`, `db:deploy` and `demo:setup`, and signs in with either role with realistic data.
- Demo visits age: if the command is run again on another day, they are not recreated (neither duplicated nor deleted).
- A production installation never has demo accounts: the command refuses to run there.
