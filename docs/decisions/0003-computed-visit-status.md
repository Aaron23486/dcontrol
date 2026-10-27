# ADR 0003: Computed visit status

**Status:** Accepted · 2026-10-23

## Context

A visit is either INSIDE or EXIT RECORDED. Storing that in its own column would duplicate what `exit_at` already says, and the two could drift apart.

## Decision

- There is no status column. A visit is inside when `exit_at IS NULL`; the API exposes the status as a computed field.
- Only `entry_at` and `exit_at` are stored, in UTC. The calendar day is derived with the CEDI's time zone (`CEDI_TIMEZONE`).
- Forgotten visits do not get a new status: they are highlighted and can be closed manually, with an audit entry.

## Consequences

- Day filters convert to the CEDI's time zone in the query, so they are tested with times close to midnight and around daylight-saving changes.
