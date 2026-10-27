# 0010 — Deployment in one container

**Status:** APPROVED (2026-10-23, Phase 11; within the stack delegated in ADR 0001)

## Context

The app must be deployable and also easy to clone and run (spec §6, §30, §31). The session uses a `SameSite=Strict` cookie (ADR 0004), which requires the web app and the API to share the site.

## Decision

- **A single container** with the API, which in production also serves the built web app (`WEB_DIST_DIR`): same origin, no cross-domain CORS and a single service to operate, plus PostgreSQL.
- **Multi-stage Docker image** (`node:22-alpine`): builds `shared`, API and web, and keeps only what is needed to run. It runs as an unprivileged user.
- ~~**Migrations on startup**~~ → superseded by ADR 0012: migrations are applied separately (`npm run db:deploy`, `migrate` service) as the table owner, and the API runs with an unprivileged user. The demo seed never runs in production.
- **`GET /api/health`** (public) checks that the database responds, for the platform's health checks.
- **Behind an HTTPS proxy** (`TRUST_PROXY=true`): Express takes the client's real IP (login rate limit) and the `Secure` cookie works.
- The port is taken from `API_PORT` or, if absent, from `PORT` (the convention of most platforms).
- `docker-compose.prod.yml` starts the database and the app together for a demo or a self-hosted server.

## Rejected alternatives

- **Web on a CDN and a separate API:** it would require `SameSite=None` and CORS with credentials, more attack surface, and adds nothing to an internal app for a gatehouse.
- **A specific platform (Render, Fly…):** the image works on any of them; choosing one requires the owner's accounts.

## Consequences

- In production the `/api/*` routes belong to the API and any other route returns the web app (SPA).
- If the web app is ever served from another domain, ADR 0004 must be revisited.
