# Documentation

CEDI Control was built with spec-driven development: requirements first, then the technical plan and the decisions, then phased tasks, each closed with its tests. These documents are the trail of that process.

| Document                                   | Role                                                                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| [`spec.md`](spec.md)                       | **Requirements.** The owner's original specification: roles, person types, flows, business rules R1-R10. First source of truth.   |
| [`plan.md`](plan.md)                       | **Design.** Decisions on the spec's ambiguities (D1-D15), additional rules (R11-R20), data model, stack, architecture and API.     |
| [`decisions/`](decisions/README.md)        | **Architecture decision records (ADRs).** One file per important decision or later change, with context and rejected options.     |
| [`constitution.md`](constitution.md)       | **Principles.** Non-negotiable rules for design, security, data integrity, testing and process.                                   |
| [`tasks.md`](tasks.md)                     | **Delivery log.** Every phase with its tasks, verification and the owner's approval (with the pull request that merged it).       |
| [`testing.md`](testing.md)                 | **Verification.** Which test covers each spec requirement and each plan rule.                                                     |
| [`security.md`](security.md)               | **Security.** Implemented measures with their tests, known limitations and deployment checklist.                                  |
| [`screenshots/`](screenshots)              | Screenshots used in the README, generated from test data with `npm run screenshots`.                                              |

Order of precedence when two documents disagree: `spec.md` > approved decisions in `plan.md` and the ADRs > `constitution.md`. Identifiers such as R1, D3 or SEC-02 are stable and are referenced from code comments, tests and pull requests.

The user interface is in Spanish; Spanish screen labels quoted in these documents (for example "Ingreso y salida") are kept as they appear in the app, with an English gloss.
