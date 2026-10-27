# 0009 — Fields by person type and required company

**Status:** APPROVED (2026-10-23). Modifies D1, D8 and D9. Adds R18 and R19.

## Context

The project owner defined which data is requested for each person type and asked that the information of one type does not mix with another's (spec §7):

| Data                                | External worker | Contractor | Maintenance / Technician | Visitor  |
| ----------------------------------- | :-------------: | :--------: | :----------------------: | :------: |
| Name, ID number, company (person)   | Yes             | Yes        | Yes                      | Yes      |
| Purpose and area (visit)            | —               | Required   | Required                 | Required |
| Tools or equipment (visit)          | —               | —          | Optional                 | —        |

## Decision

1. **Company required for everyone (D9):** `persons.company_id` and `visits.company_id` are `NOT NULL`. The `CHECK` constraints that required it "except for visitors" are removed. A private visitor is registered with a generic company, for example "Particular".
2. **No "visit type" (D8):** the `visits.visit_kind` column is removed.
3. **Fields by type on the visit (R18), enforced in the database:**
   - Contractor, technician and visitor: `purpose` and `area` required and non-empty.
   - External worker: `purpose` and `area` must be `NULL`. Information that does not correspond to the type is not stored.
4. **Tools (R16, R19):** optional and only for technicians. As it is a rule across `visits` and `visit_tools`, the visits service validates it (Phase 4) with its test. No trigger is used, to keep the logic in one place.
5. **Shared schemas:** `@cedi/shared` defines the person schema (name, ID number, company, type) and a discriminated union by type for the visit data. The web app builds the form from those schemas and the API validates with the same ones.
6. **Presentation split by type:** the people and visit views are divided into sections by type, each with its own columns (spec §15).
7. **Prefill (D1):** the purpose and area of a new visit are proposed from that person's previous visit.

## Consequences

- Migration `campos_por_tipo`: `company_id NOT NULL`, `visit_kind` removed and the per-type `CHECK` added. It does not backfill data: if a database already had people without a company or visits without purpose and area, the migration fails and that data must be fixed by hand. Today there is no real data.
- Prisma does not run each migration inside a transaction, so a failing migration can be left half-applied. New migrations that modify data or constraints are wrapped in `BEGIN; … COMMIT;`, and the integration tests leave `cedi_test` empty when they finish.
- If the person changes type, their previous visits remain valid because each visit stores its own `person_type` (R17).
