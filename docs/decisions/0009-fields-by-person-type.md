# ADR 0009: Fields by person type and a required company

**Status:** Accepted · 2026-10-23

## Context

Each person type needs different data, and the information of one type must not mix with another's ([FR-2](../requirements.md#fr-2--person-types-and-the-data-each-one-requires)):

| Data                              | External worker | Contractor | Maintenance / Technician | Visitor  |
| --------------------------------- | :-------------: | :--------: | :----------------------: | :------: |
| Name, ID number, company (person) |       Yes       |    Yes     |           Yes            |   Yes    |
| Purpose and area (visit)          |        —        |  Required  |         Required         | Required |
| Tools or equipment (visit)        |        —        |     —      |         Optional         |    —     |

## Decision

1. **Company required for everyone.** `company_id` is `NOT NULL` on persons and visits. A private visitor is registered under a generic company such as "Particular".
2. **No "visit type".** I removed the `visit_kind` column.
3. **Fields by type, enforced by the database (R18).** Contractors, technicians and visitors must have a non-empty purpose and area; for an external worker both must be `NULL`.
4. **Tools (R16, R19).** Optional and only for technicians. The rule spans `visits` and `visit_tools`, so the visits service enforces it, with its test; I avoided a trigger to keep the logic in one place.
5. **Shared schemas.** `@cedi/shared` defines the person schema and a discriminated union of visit data by type. The web form is built from those schemas and the API validates with the same ones.
6. **Presentation by type.** People and visit views are split into sections per type, each with its own columns.
7. **Prefill.** Purpose and area of a new visit are proposed from the person's previous visit.

## Consequences

- The migration does not backfill data: on a database with people without a company or visits without purpose and area it would fail and need manual fixes (there was no real data).
- Prisma does not wrap each migration in a transaction, so migrations that change data or constraints are wrapped in `BEGIN; … COMMIT;` explicitly.
- If a person changes type, their earlier visits stay valid because each visit keeps its own `person_type` (R17).
