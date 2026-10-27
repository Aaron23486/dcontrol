# 0007 — Badge as a column and catalogs as free text

**Status:** APPROVED (2026-10-23). The badge part is **superseded by ADR 0008** (there is no badge).

## Context

The spec suggests analyzing `Badges` and catalog tables, but does not ask for a badge history or administrable catalogs.

## Decision

- ~~`persons.badge_code` is unique. Badge changes are audited (D7).~~ Superseded by ADR 0008.
- Area and purpose are free text with a maximum length, without catalogs (D8). The "visit type" was removed (ADR 0009).
- Company is a table, with a unique normalized name and autocomplete. It is required for every type (D9, ADR 0009).

## Consequences

- If a badge history or catalogs are requested, they are migrated to tables with a new ADR.
