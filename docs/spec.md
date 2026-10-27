# PROJECT: External Staff Entry and Exit Control System — CEDI

## EXPRESS REQUIREMENT — REMOVAL OF THE "AUTHORIZING PERSON" FIELD

**The "Authorizing person" (_Persona que autoriza_) field must not be requested, stored or displayed anywhere in the application.** This decision applies to contractors, maintenance staff/technicians, visitors and any other person type. Therefore, the field must not appear in registration forms, entry forms, visit details, filters, reports, APIs, validations or the data model. Do not replace it with another equivalent authorization field without asking me.

**Important:** this removal refers exclusively to the person who physically authorizes entry to the CEDI. It does not remove **authentication** or **role-based authorization** in the software (Security and Administrator), which remain mandatory.

---

## 1. ROLE YOU MUST TAKE ON

Act as a senior multidisciplinary team made up of:

- Business analyst.
- Functional analyst.
- Software architect.
- Full-stack engineer.
- UI/UX designer specialized in enterprise applications.
- Database engineer.
- Application security specialist.
- QA / test engineer.
- DevOps.

Your responsibility is to design and build a **fully functional** enterprise web application, not a visual prototype or a mockup.

You must analyze the requirements, detect inconsistencies, propose improvements when necessary and build a maintainable, secure, scalable and professional solution.

You must NOT add features just to make the project look bigger. Every feature must respond to a real need of the process.

---

# 2. PROJECT CONTEXT

The project consists of building a web system for **recording and controlling the entry and exit of external staff at a CEDI (Distribution Center)**.

The CEDI receives people who do not belong directly to the organization, including:

- Recurring external workers.
- Contractors.
- Technicians.
- Maintenance staff.
- Visitors.
- Staff from other companies.

Each person is identified by their ID number (_cédula_), which Security records when they enter and when they leave.

The main goal of the system is:

> To know who is currently inside the CEDI and keep a complete and reliable history of their entries and exits.

The system must prioritize the speed of the entry and exit process, especially for the security staff who will use the application in daily operation.

---

# 3. PROBLEM TO SOLVE

The CEDI needs to control the entry and exit of external people in a centralized and traceable way.

People may come daily or only once.

A solution is required that allows:

- Keeping a centralized record.
- Quickly identifying the person by their ID number.
- Automatically recording the entry time.
- Automatically recording the exit time.
- Knowing who is inside the CEDI in real time.
- Looking up the visit history.
- Keeping different information depending on the person type.
- Keeping traceability of the operations performed.

---

# 4. GENERAL OBJECTIVE

Build a web application to manage the recording, control and lookup of the entry and exit of external staff at the CEDI.

The application must make the operating process:

> SCAN → IDENTIFY → RECORD ENTRY → PERSON INSIDE → SCAN → RECORD EXIT.

The system must be simple for the security user and complete enough to demonstrate good software development practices.

---

# 5. SYSTEM USERS

There will be only two roles.

## 5.1 Security

The main operational user.

Must be able to:

- Sign in.
- Register people.
- Search for people.
- Record entries.
- Record exits.
- See the people currently inside.
- Look up visits.
- Look up the history.
- See relevant information about a person.
- Update the data that changes over time (person type and company).

## 5.2 Administrator

Has the Security functions and can also:

- Correct a person's name or ID number when there was a data-entry error.
- Look up the necessary administrative information (audit log).

There must be no public user sign-up and no user-management screen.

The application is operated by the Security guard, with their own email and password. Accounts (Security and Administrator) are created, activated, deactivated and have their passwords changed through terminal commands.

---

# 6. AUTHENTICATION

The application will use internal authentication through:

- Username/email.
- Password.
- Secure session.
- Roles and authorization.

Do NOT implement:

- Google Login.
- Microsoft Login.
- Facebook Login.
- External OAuth.
- Public sign-up.

The reason is that the project is designed as an internal enterprise application.

The GitHub repository must be ready so that a recruiter can:

1. Clone the project.
2. Configure the environment variables.
3. Connect their own database.
4. Run the migrations.
5. Create the administrator user.
6. Sign in.
7. Use the whole system.

Do not include real credentials in the repository.

---

# 7. EXTERNAL PERSON TYPES

The system handles four person types. **All** are identified by their ID number and **all** belong to a company.

There is data **about the person**, recorded only once, and data **about each visit**, requested on each entry according to the type.

| Data                         | External worker | Contractor | Maintenance / Technician | Visitor                       |
| ---------------------------- | :-------------: | :--------: | :----------------------: | :---------------------------: |
| Full name (person)           | Required        | Required   | Required                 | Required                      |
| ID number (person)           | Required        | Required   | Required                 | Required                      |
| Company (person)             | Required        | Required   | Required                 | Required                      |
| Purpose (visit)              | —               | Required   | Required                 | Required                      |
| Area (visit)                 | —               | Required   | Required                 | Required (area being visited) |
| Tools or equipment (visit)   | —               | —          | Optional                 | —                             |

"—" means the data is **neither requested nor stored** for that type. This way the information of one type does not mix with another's.

### EXTERNAL WORKER

A person who works regularly at the CEDI but belongs to another company.

- Full name.
- ID number.
- Company.

No additional information is requested on each entry: if they are already registered, their ID number is enough.

### CONTRACTOR

A person who comes in to do a specific job.

- Full name.
- ID number.
- Company.
- On each visit: purpose and area.

### MAINTENANCE / TECHNICIAN

A person who comes in to do technical or maintenance work.

- Full name.
- ID number.
- Company.
- On each visit: purpose, area and, if they bring any, the tools or equipment they bring in.

### VISITOR

A person who visits the CEDI occasionally.

- Full name.
- ID number.
- Company.
- On each visit: purpose and area being visited.

### Fixed data and changing data

- **Name and ID number** do not change. Only an Administrator can correct them if there was a data-entry error.
- **Person type and company** may change over time (for example, someone moves from company 1 to company 2). Security can update them.
- Each visit keeps the type and company the person had when they entered, so that the history does not change when their data is updated.
- To speed things up, the purpose and area of a visit are prefilled with those of that person's previous visit.

---

# 8. KEY CONCEPT: PERSON VS VISIT

Do not store all the information in a single entity.

Separate conceptually:

## PERSON

Represents who the person is.

Example:

- ID.
- Name.
- Identification.
- Company (current; may change).
- Person type (current; may change).

## VISIT

Represents each entry made by a person.

Must store at least:

- ID.
- Person.
- Date.
- Entry time.
- Exit time.
- Status.
- User who recorded the entry.
- User who recorded the exit.
- Person type and company in effect at entry.
- Purpose and area, according to the type (section 7).
- Tools or equipment, only for maintenance / technician.

The same person can have multiple visits.

Example:

Juan Pérez can have:

Visit 1 → 07/10/2026\
Visit 2 → 08/10/2026\
Visit 3 → 09/10/2026

Do not duplicate Juan's permanent data on each visit.

---

# 9. ID NUMBER (CÉDULA)

Each person is identified by their ID number, which is unique.

The ID number may contain digits, letters and hyphens (foreign documents or passports). The system stores it normalized, in uppercase and without spaces, dots or hyphens, so that the same ID number written in different ways identifies the same person.

The system must allow:

1. Entering the ID number.
2. Looking up the associated person.
3. Showing their information.
4. Determining whether they are inside or not.
5. Recording the corresponding operation.

Initially, Security types the ID number. A physical scanner that works as a keyboard must also work without changes.

The architecture must allow other scanning methods to be integrated later without redesigning the whole system.

---

# 10. ENTRY FLOW

## Registered person

1. The person arrives at the CEDI.
2. Security enters the person's ID number.
3. The system finds the person.
4. It shows relevant information.
5. The system determines that the person has no open visit.
6. Security confirms/performs the entry.
7. The date and time are recorded.
8. The visit moves to the status:

INSIDE.

The process must be fast and require as few steps as possible.

---

## Unregistered person

1. Security enters the person's ID number.
2. The system does not find the person.
3. The registration form is shown.
4. Security selects the person type.
5. The form changes dynamically according to the type.
6. The person is registered.
7. Their first entry is recorded.

---

# 11. EXIT FLOW

1. The person leaves the CEDI.
2. Security enters the ID number again.
3. The system finds the open visit.
4. The exit date and time are recorded automatically.
5. The visit moves to:

EXIT RECORDED.

Do not request an additional form for the exit.

---

# 12. STATUSES

Keep only two main statuses:

## INSIDE

The person entered and has not recorded an exit yet.

## EXIT RECORDED

The person has already left the CEDI.

Do not create unnecessary statuses such as:

- Pending.
- Cancelled.
- Authorized.
- Scheduled.

Unless a real functional need arises later.

---

# 13. BUSINESS RULES

Implement at least the following rules:

### Rule 1

A person cannot have two open visits at the same time.

### Rule 2

An exit cannot be recorded if the person has no open visit.

### Rule 3

When an entry is recorded, the date and time must be saved automatically.

### Rule 4

When an exit is recorded, the date and time must be saved automatically.

### Rule 5

A person with an open visit must appear as "INSIDE".

### Rule 6

A closed visit must keep its history.

### Rule 7

The person's information must not be duplicated each time they come in.

### Rule 8

The data requested and stored depends on the person type, according to the table in section 7. Data that does not correspond to the type is neither requested nor stored.

### Rule 9

Administrative functions must be protected by role.

### Rule 10

Do not allow operations that produce inconsistent records.

If you identify other business rules needed to guarantee the integrity of the system, propose them before implementing them.

---

# 14. DASHBOARD

The Dashboard must be oriented to the Security user.

It must show at least:

- Number of people currently inside.
- Number of entries today.
- Number of exits today.
- List of people currently inside.
- Entry time.
- Company.
- Person type.

There must be a clearly visible main action:

> ENTER ID NUMBER

Scanning must be the main element of the interface.

Do not turn the dashboard into a screen full of unnecessary charts.

On desktop (≥ 1024 px wide, from 1280 × 720 up) the "Ingreso y salida" (entry and exit) screen is fully visible without scrolling the page: scanning, the four indicators, "Personas dentro" (people inside) and "Actividad reciente" (recent activity). Recent activity scrolls inside its panel. While the guard fills in a form of the flow, the page may scroll (ADR 0011).

---

# 15. PEOPLE

Create a module to look up people.

It must allow:

- Listing.
- Searching.
- Filtering.
- Viewing details.
- Registering.
- Editing when appropriate.

The information is presented **separated by person type** (External workers, Contractors, Maintenance / Technicians and Visitors), each section with its own columns, so as not to mix information from different types.

Search must be able to use:

- Name.
- ID number.
- Company.
- Person type.

A person's detail shows their data and their visit history, with the purpose, area and tools that apply to each visit.

---

# 16. VISITS

Create a module to look up visits.

It must allow:

- Seeing today's visits.
- Seeing the history.
- Filtering by date.
- Searching by person.
- Searching by company.
- Filtering by type.
- Filtering by status.

Clearly show:

- Person.
- Company.
- Type.
- Date.
- Entry time.
- Exit time.
- Status.
- Purpose and area, when the type has them.

---

# 17. PEOPLE CURRENTLY INSIDE

Create a specific view to quickly answer:

> Who is currently inside the CEDI?

Show:

- Name.
- Company.
- Type.
- Entry time.
- Time inside, if useful.
- Status.

This view must update correctly when someone enters or leaves.

---

# 18. MAINTENANCE AND TOOLS

For maintenance staff or technicians, recording the tools/equipment brought in must be supported.

Do not build a complex inventory-management platform.

The only goal is to keep information such as the following within the visit:

- Tool/equipment.
- Description.
- Quantity, if applicable.

The design must allow this feature to be extended later if the business requires it.

---

# 19. AUDIT LOG

Implement traceability of important actions.

Record at least:

- User who performed the action.
- Action performed.
- Date and time.
- Affected entity.
- Identifier of the affected record.

Important actions include:

- Creating a person.
- Modifying a person.
- Recording an entry.
- Recording an exit.
- Changing a person's type or company.
- Correcting a person's name or ID number.

Do not store unnecessary sensitive information in logs.

---

# 20. DATABASE

Design a normalized relational database.

At a minimum, entities similar to these must be analyzed:

- Users
- Roles
- Persons
- Companies
- Visits
- VisitTools / VisitItems
- AuditLogs

Do not assume all of these tables are mandatory.

First analyze the relationships and justify the final structure.

Avoid:

- Unnecessary duplication.
- Circular relationships.
- Generic fields without a purpose.
- JSON for information that should be normalized.
- Over-engineering.

Create appropriate primary keys, foreign keys, indexes and constraints.

Fields frequently used for searching must be properly indexed.

---

# 21. ARCHITECTURE

Use a professional, maintainable architecture appropriate for an enterprise application.

Clearly separate:

- UI / presentation.
- Business logic.
- Data access.
- Authentication/authorization.
- API.
- Persistence.

Avoid mixing business logic directly into visual components.

Apply the principles of:

- SOLID.
- DRY.
- Separation of Concerns.
- Clean Code.
- Centralized validation.
- Consistent error handling.

Do not implement complex patterns if they do not add real value.

---

# 22. API

Design a clean and consistent API.

Endpoints must represent real resources.

Conceptual examples:

- `/auth`
- `/users`
- `/persons`
- `/companies`
- `/visits`
- `/dashboard`
- `/audit`

Using exactly these names is not mandatory.

Use:

- Correct HTTP methods.
- Appropriate HTTP status codes.
- Input validation.
- Consistent error handling.
- Authorization per endpoint.
- DTOs where appropriate.

---

# 23. SECURITY

Implement good practices:

- Passwords stored with secure hashing.
- No plain-text passwords.
- Secure sessions/tokens.
- Role-based authorization.
- Server-side validation.
- Protection against unauthorized access.
- Protection against SQL injection.
- Protection of sensitive information.
- Environment variables.
- No secrets committed to the repository.
- Properly configured CORS.
- Data validation.
- Secure error handling.

Do not reveal internal details of the application in error messages to the end user.

---

# 24. UI/UX

The application must look like **modern enterprise software**: professional and clean.

It must not look like:

- A generic template.
- A university project.
- An overloaded dashboard.
- A landing page.

Prioritize:

- Clarity.
- Speed.
- Visual hierarchy.
- Accessibility.
- Consistency.
- Responsive design.
- Clear states.
- Immediate feedback.

The main action must be obvious.

The Security user must be able to record an entry/exit in a few seconds.

---

# 25. SCANNING EXPERIENCE

The system must be designed with a barcode scanner that behaves like a keyboard in mind.

When the user scans:

```
123456789

```

the application must process the code without forcing the user to make multiple clicks.

Consider:

- Scan field focused automatically.
- Enter as the end of the scan.
- Visual feedback.
- Optional sound feedback.
- Success message.
- Error message.
- Avoiding accidental double recording.
- Clearly showing whether an ENTRY or an EXIT was recorded.

If the scanner sends Enter automatically, take advantage of it.

---

# 26. ERROR HANDLING

Create clear messages for situations such as:

- ID number not registered.
- Person is already inside.
- Person has no open visit.
- Invalid code.
- Connection error.
- Incomplete data.
- User without permissions.

Errors must be understandable for operational staff.

Do not show technical errors such as stack traces to the user.

---

# 27. RESPONSIVE DESIGN

The application must work correctly on:

- Desktop.
- Laptop.
- Tablet.

The main interface must be optimized for the operating environment of a CEDI.

Prioritize desktop/tablet over mobile, but keep a responsive experience.

All screens share the design system of ADR 0011 (colors, typography, icons, cards, tables and states). No screen overflows horizontally.

---

# 28. ACCESSIBILITY

Apply basic good practices:

- Adequate contrast.
- Clear labels.
- States not communicated by color alone.
- Keyboard navigation where appropriate.
- Inputs correctly associated with labels.
- Clear error messages.
- Adequate button sizes.

---

# 29. TECHNOLOGIES

Before starting development, analyze and propose a suitable technology stack.

Prioritize:

- Modern technologies.
- Maturity.
- Maintainability.
- Ease of installation.
- Good documentation.
- Suitability for a portfolio project.
- Ease for a recruiter to clone and run the project.

Do not choose technologies just because they are popular.

Briefly explain the reason for each selected technology.

---

# 30. PROJECT SETUP

The project must be runnable from scratch by following clear instructions.

It must include:

- `.env.example`
- Migrations.
- Initial seed.
- Database configuration.
- Initial administrator user through a secure process.
- Development scripts.
- Production scripts.
- Installation documentation.

Never include:

- A real `.env`.
- Real passwords.
- Real API keys.
- Tokens.
- Secrets.

---

# 31. GITHUB / PORTFOLIO

The project will be published on GitHub as a professional portfolio project.

The README must include:

## Description

What problem it solves.

## Features

Main functionality.

## Architecture

Description of the architecture.

## Technologies

Stack used.

## Database

Model and relationships.

## Installation

Steps from scratch.

## Configuration

Required environment variables.

## Migrations

How to set up the database.

## Initial user

How to create the administrator.

## Running

How to run the frontend/backend.

## Screenshots

Space for screenshots.

## Technical decisions

Explain important decisions.

## Security

Briefly explain the measures implemented.

## Future improvements

Only reasonable features.

---

# 32. DO NOT

Do not implement:

- Google login.
- Microsoft login.
- Public sign-up.
- Unnecessary features.
- A complex booking system.
- Unnecessary notifications.
- Full inventory modules.
- Human resources modules.
- Internal employee management.
- Features unrelated to the main objective.

Do not overcomplicate the project.

---

# 33. CODE QUALITY

All generated code must be:

- Readable.
- Typed when the language allows it.
- Modular.
- Maintainable.
- Consistent.
- Documented only where it adds value.

Avoid:

- Duplicated code.
- Giant functions.
- Giant components.
- Ambiguous variables.
- Hardcoding.
- Business logic in the UI.
- Unnecessary comments.
- Unresolved TODOs.

---

# 34. TESTING

Implement tests for the critical rules.

At a minimum, test:

### People

- Create a person.
- Search for a person.
- Validate identification.
- Validate the format and uniqueness of the ID number.

### Entries

- Record an entry.
- Prevent a double entry.
- Registered person.
- Unregistered person.

### Exits

- Record an exit.
- Prevent an exit without an entry.
- Close the visit correctly.

### Authorization

- Security cannot access administrative functions.
- Administrator can administer users.

### Integrity

- A person cannot have two open visits.

---

# 35. PHASED DEVELOPMENT

Do NOT try to build everything at once.

Work in phases.

## PHASE 1 — Analysis

Before programming:

- Review the requirements.
- Detect ambiguities.
- Propose the architecture.
- Propose the data model.
- Define the flows.
- Define the stack.

Do NOT write code yet.

Present the decisions and wait for validation.

---

## PHASE 2 — Project foundation

Create:

- Structure.
- Configuration.
- Database.
- Migrations.
- Authentication.
- Roles.
- Seed.

---

## PHASE 3 — People

Implement:

- CRUD.
- Person types.
- Companies.
- Validations.

---

## PHASE 4 — Entry and exit

Implement:

- Scanning.
- Entry recording.
- Exit recording.
- Statuses.
- Validations.
- Feedback.

---

## PHASE 5 — Dashboard

Implement:

- People inside.
- Today's entries.
- Today's exits.
- Recent activity.

---

## PHASE 6 — History

Implement:

- History.
- Searches.
- Filters.
- Visit details.

---

## PHASE 7 — Tools

Implement tool/equipment information for maintenance staff/technicians.

---

## PHASE 8 — Audit log

Implement traceability of actions.

---

## PHASE 9 — Testing

Create unit/integration/e2e tests as appropriate.

---

## PHASE 10 — Final UI/UX

Perform a full review:

- Responsive.
- Accessibility.
- States.
- Errors.
- Loading.
- Empty states.
- Feedback.
- Visual consistency.

---

## PHASE 11 — Production

Prepare:

- Environment variables.
- Build.
- Migrations.
- Security.
- Deployment.
- Documentation.

---

# 36. WAY OF WORKING

In each phase:

1. Analyze.
2. Explain what you are going to implement.
3. Identify possible problems.
4. Propose solutions.
5. Implement.
6. Run tests.
7. Verify that you have not broken existing functionality.
8. Summarize the changes.
9. State what remains pending.

Do not automatically move on to an important phase if there is an architectural decision that is still unclear.

---

# 37. GENERAL PRINCIPLE OF THE PROJECT

The application must follow this principle:

> **Simple to operate, technically solid and functionally complete.**

The Security user must not need technical knowledge to use it.

The complexity must be in the architecture and the quality of the software, not in the user experience.

---

# 38. FIRST TASK

Do NOT start by writing code.

First perform a professional analysis of the project.

Deliver:

1. Functional requirements.
2. Non-functional requirements.
3. Actors and permissions.
4. Use cases.
5. Entry flow.
6. Exit flow.
7. Business rules.
8. Main entities.
9. Proposed data model.
10. Relationships between entities.
11. Proposed architecture.
12. Recommended technology stack.
13. Proposed folder structure.
14. Authentication strategy.
15. Authorization strategy.
16. Audit strategy.
17. Testing strategy.
18. Initial README structure.
19. Risks or ambiguities detected.
20. Improvement recommendations.

After presenting this analysis, wait for my approval before starting the implementation.

Do not invent business requirements that have not been defined. When a decision is needed, present the recommendation and briefly explain why.
