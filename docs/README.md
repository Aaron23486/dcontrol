# Documentation

I designed CEDI Control requirements-first: the requirements came before any code, design decisions were written down before they were implemented, and every business rule was closed with its tests. These documents keep that trail.

| Document                              | What it covers                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [requirements.md](requirements.md)    | What the system must do: users and roles, person types, flows, business rules and non-functional requirements. |
| [architecture.md](architecture.md)    | How it is built: principles, API and web structure, data model and database constraints, stack, design decisions. |
| [decisions/](decisions/README.md)     | Architecture decision records: the context, decision, alternatives and consequences of each significant choice.  |
| [security.md](security.md)            | Security measures with their tests, known limitations and a deployment checklist.                               |
| [testing.md](testing.md)              | Test levels, current figures and which tests cover each requirement and rule.                                   |
| [screenshots/](screenshots)           | Screenshots used in the README, generated from test data with `npm run screenshots`.                            |

The project history is in [CHANGELOG.md](../CHANGELOG.md).

**Identifiers.** Requirements (FR-1…, NFR-1…), business rules (R1…R20) and design decisions (D1…D15) have stable identifiers so that code comments, tests and ADRs can point to them. SEC-xx identifiers refer to findings of the security review.

**Language.** The documentation is in English; the user interface is in Spanish, so screen labels and test names are quoted as they appear in the app.
