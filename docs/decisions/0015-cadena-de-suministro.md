# 0015 — Supply chain in CI: audit, secrets and pinned actions

**Status:** APPROVED (2026-10-26, remediation of the security audit: SEC-11).

## Context

The audit (SEC-11) found that:

- CI did not check for known vulnerabilities in dependencies or for secrets in the Git history;
- GitHub Actions were used by a movable tag (`@v4`), which their owner can repoint to other code;
- the workflow had the default `GITHUB_TOKEN` permissions.

## Decision

- **`supply-chain` job** in CI, in parallel with the test job:
  - `npm audit --audit-level=high`: fails on high or critical vulnerabilities, production or development (development tools also run in CI).
  - **gitleaks** over the whole history (`fetch-depth: 0`) with `--redact`, so a finding never shows the value in the public CI logs. It runs from its official image pinned by digest, the same command that can be run locally with Docker. No third-party action is used, which would ask for permissions on PRs.
- **Actions pinned by commit** (`actions/checkout`, `setup-node`, `upload-artifact`), with the version in a comment.
- **`permissions: contents: read`** for the whole workflow.
- **Weekly Dependabot** for npm and for the actions. It groups patch and minor versions in one PR; each major version arrives in its own PR. It only proposes: every PR goes through the full CI and is reviewed before merging.
  - _Adjustment on 2026-10-26/27, after reviewing the first PRs:_ Dependabot does not propose major versions of `@types/node`, `@nestjs/*` or `typescript`; they are done on purpose, as their own unit. The types must match the Node version used by the app and CI (22) (PR #11). NestJS shares its major version across its packages and Dependabot proposed it piece by piece, which leaves the API unable to start (PR #13, #18, #20); a `nestjs` group did not prevent it and was removed. TypeScript depends on `typescript-eslint` supporting the new version (PR #17). Majors of `vitest`/`@vitest/*`, which must move together (PR #27), and of `eslint`/`@eslint/js`, because ESLint 10 requires Node ≥ 22.13 (PR #29), are not proposed either. Their minor and patch versions still arrive in the weekly group.
- **Versions:** the `^` ranges in `package.json` are kept. What gets installed is defined by `package-lock.json`, and `npm ci` (CI and Docker image) fails if it does not match `package.json`.

## Rejected alternatives

- **Pinning exact versions in `package.json`:** the lockfile already gives reproducible installs; pinning everything would add changes without a verifiable benefit.
- **`gitleaks/gitleaks-action`:** needs the token with permissions on PRs and is another third-party dependency to pin.
- **Automatic updates (Dependabot auto-merge):** contradicts the rule of reviewing each update.

## Consequences

- A high vulnerability published in a dependency makes CI fail until it is updated or its exception is documented.
- Pinned actions do not receive fixes on their own: Dependabot proposes the new commit.
- GitHub's secret scanning (and its push protection) is a repository option: the owner enables it in Settings → Code security.
