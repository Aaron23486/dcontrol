# Requirements

CEDI Control records the entry and exit of external staff at a distribution center (CEDI) and shows, at any moment, who is inside. This document is the source of truth for what the system must do. How it is built is described in [architecture.md](architecture.md), and each significant decision has an ADR in [decisions/](decisions/README.md).

Requirements have stable identifiers (FR, NFR, R) so that code, tests and decisions can reference them.

## 1. Context and goal

A distribution center receives people who do not belong to the organization: recurring external workers, contractors, maintenance technicians and visitors. Some come every day, others only once. Without a system, knowing who is inside, since when and with which tools depends on paper logbooks.

**Goal:** know who is currently inside the CEDI and keep a complete, reliable history of every entry and exit.

The operating flow is:

> SCAN → IDENTIFY → RECORD ENTRY → PERSON INSIDE → SCAN → RECORD EXIT

The guiding principle: **simple to operate, technically solid and functionally complete.** The guard needs no technical knowledge; the complexity belongs in the architecture, not in the user experience. Speed at the gatehouse comes first.

## 2. Scope

**In scope:** people registration, entry and exit recording, people currently inside, visit history, tools brought in by technicians, audit log, two roles with internal authentication.

**Out of scope:**

- An "Authorizing person" field. It is not requested, stored or displayed anywhere (forms, visit details, filters, reports, API, validation or data model), and it is not replaced by an equivalent field. This refers only to the person who physically authorizes entry; software authentication and role-based authorization remain mandatory.
- Google, Microsoft, Facebook or any external OAuth login, and public sign-up.
- Booking or scheduling, notifications, inventory management, human resources or internal employee management.
- Visit statuses beyond the two defined in FR-7 (no "pending", "cancelled", "authorized" or "scheduled").

## 3. Users and roles

**FR-1 — Roles and access.** There are exactly two roles.

| Capability                                                         | Security | Administrator |
| ------------------------------------------------------------------ | :------: | :-----------: |
| Sign in                                                            |    ✓     |       ✓       |
| Register and search people                                         |    ✓     |       ✓       |
| Record entries and exits                                           |    ✓     |       ✓       |
| See people inside, visits and history                              |    ✓     |       ✓       |
| Update the data that changes over time (person type and company)   |    ✓     |       ✓       |
| Correct a person's name or ID number after a data-entry error      |          |       ✓       |
| Consult the audit log                                              |          |       ✓       |

- Security is the main operational user: the guard at the gatehouse, with their own email and password.
- There is no public sign-up and no user-management screen. Accounts (Security and Administrator) are created, activated, deactivated and have their passwords reset with terminal commands.
- Authentication is internal: email, password, secure session, roles.

## 4. Functional requirements

### FR-2 — Person types and the data each one requires

Four person types. **All** are identified by their ID number (_cédula_) and **all** belong to a company. Person data is recorded once; visit data is requested on each entry, according to the type.

| Data                         | External worker | Contractor | Maintenance / Technician | Visitor                       |
| ---------------------------- | :-------------: | :--------: | :----------------------: | :---------------------------: |
| Full name (person)           |    Required     |  Required  |         Required         |           Required            |
| ID number (person)           |    Required     |  Required  |         Required         |           Required            |
| Company (person)             |    Required     |  Required  |         Required         |           Required            |
| Purpose (visit)              |        —        |  Required  |         Required         |           Required            |
| Area (visit)                 |        —        |  Required  |         Required         | Required (area being visited) |
| Tools or equipment (visit)   |        —        |     —      |         Optional         |               —               |

"—" means the data is neither requested nor stored for that type, so information from different types never mixes.

- **External worker:** works regularly at the CEDI for another company. Once registered, the ID number is enough to come in.
- **Contractor:** comes in to do a specific job.
- **Maintenance / Technician:** comes in for technical or maintenance work, possibly with tools.
- **Visitor:** visits occasionally.

Name and ID number do not change; only an Administrator can correct them. Person type and company can change over time, and Security can update them. To speed up entry, purpose and area are prefilled from the person's previous visit.

### FR-3 — Person and visit are separate

A **person** is who someone is (name, ID number, current company and type). A **visit** is each time they come in: person, entry time, exit time, who recorded each, the type and company in effect at entry, purpose and area according to the type, and tools for technicians. A person has many visits; permanent data is never copied onto each visit. Each visit keeps the type and company of its moment, so updating a person never rewrites history.

### FR-4 — ID number

- Unique per person. It may contain digits, letters and hyphens (foreign documents or passports).
- Stored normalized — uppercase, without spaces, dots or hyphens — so the same ID typed differently identifies the same person.
- Typed by the guard; a physical scanner that behaves like a keyboard must work without changes. Other scanning methods (such as a camera) must be addable later without redesigning the system.

### FR-5 — Entry flow

**Registered person:** the guard enters the ID number → the system finds the person and shows relevant information → it confirms there is no open visit → the guard confirms → the entry date and time are recorded → the person is INSIDE. As few steps as possible.

**Unregistered person:** the guard enters the ID number → the system does not find the person → the registration form opens → the guard selects the person type → the form adapts to the type → the person and their first entry are recorded together.

### FR-6 — Exit flow

The guard enters the ID number again → the system finds the open visit → the exit date and time are recorded automatically → the visit becomes EXIT RECORDED. No additional form is requested.

### FR-7 — Visit status

Only two statuses: **INSIDE** (entered, no exit yet) and **EXIT RECORDED**.

### FR-8 — Gatehouse dashboard

Oriented to Security. Entering the ID number is the main, clearly visible action. It shows the number of people inside, today's entries and exits, the list of people inside with entry time, company and type, and recent activity. No decorative charts. On desktop (from 1280 × 720) the whole screen — scanning, indicators, people inside and recent activity — is visible without scrolling the page; recent activity scrolls inside its panel.

### FR-9 — People

List, search, filter, view details, register and edit where allowed. Information is presented **separately per person type**, each with its own columns. Search by name, ID number, company or type. A person's detail shows their data and visit history with the purpose, area and tools of each visit.

### FR-10 — Visit history

Today's visits and the full history, filtered by date, type and status, searchable by person or company. Each visit shows person, company, type, date, entry and exit time, status, and purpose and area when the type has them.

### FR-11 — People currently inside

A dedicated view answering "who is inside right now?": name, company, type, entry time, time inside and status. It updates when someone enters or leaves.

### FR-12 — Tools

For technicians, the tools or equipment brought in are kept with the visit: name, description and quantity when relevant. This is not an inventory system, but the design allows extending it later.

### FR-13 — Audit log

Important actions are traceable: who did it, which action, when, on which entity and which record. Audited actions: creating and modifying a person (including type, company, name and ID number changes), recording an entry and recording an exit. Logs never store unnecessary sensitive information.

## 5. Business rules

Rules R1-R10 come from the original requirements; R11-R20 were added during design to guarantee integrity.

| ID  | Rule                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------- |
| R1  | A person cannot have two open visits at the same time.                                                                          |
| R2  | An exit cannot be recorded if the person has no open visit.                                                                     |
| R3  | Recording an entry stores its date and time automatically.                                                                      |
| R4  | Recording an exit stores its date and time automatically.                                                                       |
| R5  | A person with an open visit appears as INSIDE.                                                                                  |
| R6  | A closed visit keeps its history.                                                                                               |
| R7  | Person data is not duplicated on each entry.                                                                                    |
| R8  | The data requested and stored depends on the person type (FR-2).                                                                |
| R9  | Administrative functions are protected by role.                                                                                 |
| R10 | No operation may leave inconsistent records.                                                                                    |
| R11 | The exit time is never earlier than the entry time.                                                                             |
| R12 | The user who recorded the exit exists if and only if there is an exit time.                                                     |
| R13 | The ID number is unique.                                                                                                        |
| R14 | A deactivated user loses access on their next request.                                                                          |
| R15 | The last active Administrator cannot be deactivated.                                                                            |
| R16 | Only technicians can have tools on a visit.                                                                                     |
| R17 | Each visit stores the person type and company in effect at entry; later changes to the person do not alter the history.         |
| R18 | Contractors, technicians and visitors give purpose and area on every visit; an external worker's visit has neither.             |
| R19 | Tools are optional for technicians and rejected for every other type.                                                           |
| R20 | Changing a password or deactivating an account invalidates its open sessions.                                                   |

## 6. Non-functional requirements

**NFR-1 — Security.** Passwords stored with a secure hash, never in plain text. Secure sessions, role-based authorization on every endpoint, server-side validation, protection against unauthorized access and SQL injection, secrets only in environment variables and never in the repository, correctly configured CORS, and error messages that reveal no internal details. Details in [security.md](security.md).

**NFR-2 — Usability and scanning.** The application looks like modern enterprise software: clear hierarchy, consistent, immediate feedback, the main action obvious. A guard records an entry or exit in a few seconds. The scan field is focused automatically, Enter submits (a scanner that sends Enter needs no extra click), the result clearly says ENTRY or EXIT, there is visual and optional sound feedback, and accidental double recording is prevented.

**NFR-3 — Error handling.** Clear messages for operational staff: ID number not registered, person already inside, no open visit, invalid code, connection error, incomplete data, missing permission. No stack traces or technical errors are shown.

**NFR-4 — Responsive design.** Works on desktop, laptop and tablet, prioritizing the gatehouse environment over mobile. All screens share one design system ([ADR 0011](decisions/0011-design-system.md)) and none overflows horizontally.

**NFR-5 — Accessibility.** Adequate contrast, clear labels associated with their inputs, states never conveyed by color alone, keyboard navigation, clear error messages and adequately sized controls.

**NFR-6 — Data and architecture.** A normalized relational database with appropriate keys, indexes and constraints, without generic fields, JSON for structured data or circular relationships. A layered architecture that keeps presentation, business logic, data access, authentication and the API separate, applying SOLID, DRY, separation of concerns, centralized validation and consistent error handling, without complexity that adds no value.

**NFR-7 — Setup and reproducibility.** Anyone can clone the repository, configure the environment, connect their own database, run migrations, create the first administrator (or the demo accounts), sign in and use the whole system by following the README. The repository includes `.env.example`, migrations, seed, development and production scripts, and never real credentials or secrets.

**NFR-8 — Testing.** The critical rules are tested, at a minimum:

- People: create, search, validate the ID number format and uniqueness.
- Entries: record an entry, prevent a double entry, registered and unregistered person.
- Exits: record an exit, prevent an exit without an entry, close the visit correctly.
- Authorization: Security cannot use administrative functions; account administration works.
- Integrity: a person never has two open visits.

The traceability from each requirement and rule to its tests is in [testing.md](testing.md).
