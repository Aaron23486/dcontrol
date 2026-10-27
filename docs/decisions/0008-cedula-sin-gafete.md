# 0008 — Identification by ID number, no badge

**Status:** APPROVED (2026-10-23). Integrated into the spec (§5, §7, §9). Supersedes D7 and modifies D10, D13, D14, R13 and R15. Adds R17.

## Context

The project owner clarified how the gatehouse operates:

- External people have no badge. They give their ID number (_cédula_) and the guard types it.
- If the ID number is already registered, no data is requested again: only the entry or exit is recorded.
- The ID number and the name do not change. The company and the person type can change over time.
- Only the guard uses the app, with their own account. A user-management screen is not needed.

## Decision

1. **No badge.** `persons.badge_code` is removed. Search and scanning use `persons.identification` (ID number), which is unique.
2. **ID number normalization (D10):** it can be typed with digits, letters, hyphens, spaces and dots. It is stored in uppercase with letters and digits only, between 4 and 20 characters. This way `1-234-567`, `1.234.567` and `1234567` identify the same person. Normalization lives in `@cedi/shared` and is used the same way in the web app and the API.
3. **Fixed data and changing data (D13):**
   - ID number and name: only Admin corrects them, for data-entry errors, with auditing.
   - Type and company: Security and Admin can change them, with auditing.
4. **Faithful history (R17):** `visits` stores `person_type` and `company_id` when the entry is recorded. Visit reports use those values, not the person's current ones. The company is required on the visit (ADR 0009).
5. **Users without a screen (D14):**
   - A terminal command (`npm run users`) creates SECURITY or ADMIN accounts, lists them, activates or deactivates them and resets passwords.
   - R14 still holds: a deactivated account loses access on its next request.
   - R15 no longer applies because there is no user editing on the web. Instead, the command prevents deactivating the last active ADMIN.
6. **Scanning:** `POST /scans {identification}`; `BADGE_NOT_FOUND` is renamed `PERSON_NOT_FOUND`. `ScannerSource` stays: today input is typed manually, and a keyboard-style scanner would keep working without changes.

## Consequences

- A migration removes `badge_code` and adds `person_type` and `company_id` to `visits`.
- A typo in the ID number creates a new person. That is why the Admin correction is audited, and the registration form shows the normalized ID number for confirmation.
- If a badge or another method is reintroduced in the future, a new column or table and another `ScannerSource` implementation will be enough.
