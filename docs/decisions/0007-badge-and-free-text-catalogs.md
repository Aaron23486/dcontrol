# ADR 0007: Badge column and free-text catalogs

**Status:** Accepted · 2026-10-23 · Badge part superseded by [ADR 0008](0008-id-number-identification.md)

## Context

The first analysis considered badge and catalog tables, but the requirements asked for neither a badge history nor administrable catalogs.

## Decision

- ~~`persons.badge_code` is unique and badge changes are audited.~~ Superseded: there is no badge (ADR 0008).
- Area and purpose are free text with a maximum length, without catalogs. There is no "visit type" ([ADR 0009](0009-fields-by-person-type.md)).
- Company is a table, with a unique normalized name and autocomplete, and it is required for every person type.

## Consequences

- If catalogs are ever needed, they become tables through a new ADR.
