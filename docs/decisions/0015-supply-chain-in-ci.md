# ADR 0015: Supply-chain checks in CI

**Status:** Accepted · 2026-10-26

## Context

The security review found that CI did not check dependencies for known vulnerabilities or the Git history for secrets, that GitHub Actions were referenced by movable tags (`@v4`) their owners could repoint, and that the workflow ran with the default `GITHUB_TOKEN` permissions.

## Decision

- **A `supply-chain` job** runs in parallel with the test job:
  - `npm audit --audit-level=high` fails on high or critical vulnerabilities, in production or development dependencies (development tools run in CI too).
  - **gitleaks** scans the whole history (`fetch-depth: 0`) with `--redact`, so a finding never prints the secret in public logs. It runs from its official image pinned by digest — the same command can be run locally with Docker — instead of a third-party action that would need permissions on pull requests.
- **Actions pinned by commit SHA**, with the version in a comment.
- **`permissions: contents: read`** for the whole workflow.
- **Weekly Dependabot** for npm and GitHub Actions. Minor and patch updates are grouped in one pull request; each major update arrives on its own. Dependabot only proposes: every pull request goes through the full CI and is reviewed before merging.
- **Major updates that must be planned** are ignored by Dependabot and done deliberately: `@types/node` (must match the Node version the app runs on), `@nestjs/*` (all packages must move together; Dependabot proposed them one at a time and the API would not start), `typescript` (depends on `typescript-eslint` support), `vitest` and `@vitest/*` (must share a major version), and `eslint` with `@eslint/js` (ESLint 10 requires a newer Node minimum). Their minor and patch updates still arrive weekly.
- **Version ranges:** `package.json` keeps `^` ranges; what gets installed is defined by `package-lock.json`, and `npm ci` (in CI and in the Docker image) fails if they disagree.

## Alternatives considered

- **Exact versions in `package.json`:** the lockfile already makes installs reproducible.
- **`gitleaks/gitleaks-action`:** it needs a token with pull-request permissions and is one more third-party dependency to pin.
- **Dependabot auto-merge:** it contradicts reviewing every update.

## Consequences

- A newly published high-severity vulnerability makes CI fail until the dependency is updated or the exception is documented.
- Pinned actions do not pick up fixes on their own; Dependabot proposes the new commit.
- GitHub's own secret scanning and push protection, and CodeQL code scanning, are enabled in the repository settings since it became public (2026-10-27).
