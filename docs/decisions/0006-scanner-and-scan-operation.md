# ADR 0006: Scanner and scan operation

**Status:** Accepted · 2026-10-23 · Amended by [ADR 0008](0008-id-number-identification.md) (the input is the ID number, not a badge)

## Context

Today the guard types the ID number, or uses a scanner that behaves like a keyboard (it types the code and sends Enter). A camera may come later. The gatehouse must work with as few steps as possible.

## Decision

- In the web app, scanner input sits behind a `ScannerSource` interface. The current implementation handles keyboard and keyboard-style scanners.
- The API exposes a single operation, `POST /scans {identification}`, which decides the outcome: `EXIT_REGISTERED`, `ENTRY_PENDING`, `PERSON_NOT_FOUND`, `CONFIRMATION_REQUIRED` (double scan) or `PREVIOUS_DAY_VISIT_OPEN` (forgotten visit). With `confirmed: true` the guard confirms either case.
- The entry is recorded with `POST /visits` — for an existing person, or for a new person together with their first entry in one transaction — and a forgotten visit is closed with `PATCH /visits/:id/close` and the real exit time.
- The rules live in the visits service, not in the UI: automatic exit when there is an open visit, confirmation when the previous operation was less than 60 seconds ago, and purpose and area prefilled from the last visit.

## Consequences

- Adding a camera only requires another `ScannerSource` implementation.
- The whole flow is covered by end-to-end tests.
