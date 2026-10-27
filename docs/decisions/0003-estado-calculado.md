# 0003 — Computed visit status

**Status:** APPROVED (2026-10-23)

## Context

The spec defines two statuses: INSIDE and EXIT RECORDED. Storing them in a separate column would duplicate the information in `exit_at` and could contradict it.

## Decision

- There is no status column. `INSIDE` means `exit_at IS NULL`; the API exposes it as a computed field.
- Only `entry_at` and `exit_at` are stored, in UTC. The calendar date is obtained with the CEDI's time zone (environment variable, D6).
- Forgotten visits do not create a new status: they are highlighted and closed manually, with auditing (D3).

## Consequences

- Day filters convert to the CEDI's time zone in the query; this needs tests with times close to midnight.
