# 0002 — Single open visit enforced in the database

**Status:** APPROVED (2026-10-23)

## Context

R1: a person cannot have two open visits. If two gatehouses enter the same ID number at the same time, a check only in code has a race condition.

## Decision

- Partial unique index `visits(person_id) WHERE exit_at IS NULL`.
- `CHECK (exit_at IS NULL OR exit_at >= entry_at)` (R11) and `CHECK ((exit_at IS NULL) = (exit_by IS NULL))` (R12).
- The service checks before inserting to give a clear message, and translates an index violation (code `P2002`) into a `{ code, message }` business error.

## Consequences

- Requires integration tests against real PostgreSQL, including a concurrency test.
