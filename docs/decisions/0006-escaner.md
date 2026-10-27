# 0006 — Scanner and scan operation

**Status:** APPROVED (2026-10-23). Amended by ADR 0008: the input is the ID number, not a badge.

## Context

Today a scanner that acts as a keyboard (it types the code and sends Enter) and manual input are used; in the future, perhaps a camera. The gatehouse must operate with as few steps as possible.

## Decision

- In the web app, scanner input sits behind a `ScannerSource` interface. Today's implementations are keyboard-scanner and manual.
- The API exposes a single operation `POST /scans {identification}`, which decides the result: `EXIT_REGISTERED`, `ENTRY_PENDING`, `PERSON_NOT_FOUND`, `CONFIRMATION_REQUIRED` (D2) or `PREVIOUS_DAY_VISIT_OPEN` (D3). With `confirmed: true` the guard confirms a double scan or a forgotten visit.
- The entry is recorded with `POST /visits` (an existing person, or a new person together with their first entry, in one transaction) and a forgotten visit is closed with `PATCH /visits/:id/close` giving the real exit time.
- The rules live in the `visits` service, not in the UI: automatic exit if there is an open visit, confirmation if the previous operation was less than 60 s ago (D2), and data prefilled from the last visit (D1).

## Consequences

- Adding a camera only requires another `ScannerSource` implementation.
- The full flow is covered by Playwright e2e tests.
