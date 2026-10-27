# ADR 0008: Identification by ID number, without badges

**Status:** Accepted · 2026-10-23 · Supersedes the badge part of [ADR 0007](0007-badge-and-free-text-catalogs.md)

## Context

Walking through how the gatehouse really works changed some early assumptions:

- External people have no badge. They give their ID number (_cédula_) and the guard types it.
- If the ID number is already registered, nothing else is asked: only the entry or exit is recorded.
- The ID number and the name never change; the company and the person type can.
- Only the guard uses the app, with their own account. A user-management screen is unnecessary.

## Decision

1. **No badge.** I removed `persons.badge_code`. Search and scanning use `persons.identification`, which is unique.
2. **Normalized ID number.** It can be typed with digits, letters, hyphens, spaces and dots, and is stored uppercase with letters and digits only (4-20 characters), so `1-234-567`, `1.234.567` and `1234567` are the same person. The normalization lives in `@cedi/shared` and is identical in the web app and the API.
3. **Fixed and changing data.** Only an Administrator corrects name and ID number (data-entry errors); both roles can change type and company. Every change is audited.
4. **Faithful history (R17).** Each visit stores the `person_type` and `company_id` in effect at entry, and visit reports use those values.
5. **Users from the terminal.** `npm run users` creates Security or Administrator accounts, lists them, activates or deactivates them and resets passwords. A deactivated account still loses access on its next request (R14), and the command refuses to deactivate the last active Administrator (R15).
6. **Scanning.** `POST /scans {identification}`; the "badge not found" result became `PERSON_NOT_FOUND`. `ScannerSource` stays, so a keyboard-style scanner keeps working.

## Consequences

- A migration removed `badge_code` and added `person_type` and `company_id` to visits.
- A typo in the ID number creates a new person. The registration form shows the normalized ID for confirmation, and the Administrator's correction is audited.
- Account changes made from the terminal are not part of the app's audit log, because no app user makes them; they remain in the server's terminal history.
- If a badge or another identifier comes back, it needs a new column or table and another `ScannerSource` implementation.
