# ADR 0002: Single open visit enforced by the database

**Status:** Accepted · 2026-10-23

## Context

A person can never have two open visits (R1). If two gatehouses enter the same ID number at the same moment, a check that lives only in application code has a race condition.

## Decision

I enforce the rule in PostgreSQL:

- A partial unique index `visits(person_id) WHERE exit_at IS NULL`.
- `CHECK (exit_at IS NULL OR exit_at >= entry_at)` (R11) and `CHECK ((exit_at IS NULL) = (exit_by IS NULL))` (R12).

The service still checks before inserting, to give the guard a clear message, and translates an index violation (Prisma code `P2002`) into a `{ code, message }` business error.

## Consequences

- The rule holds even under concurrent writes, which requires integration tests against real PostgreSQL, including a concurrency test with several simultaneous scans.
