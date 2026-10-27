# ADR 0010: Single-container deployment

**Status:** Accepted · 2026-10-23 · Migrations-on-startup part superseded by [ADR 0012](0012-unprivileged-database-role.md)

## Context

The app has to be deployable and also easy to clone and run. The session cookie is `SameSite=Strict` ([ADR 0004](0004-authentication-and-session.md)), which requires the web app and the API to share the same site.

## Decision

- **One container** with the API, which in production also serves the built web app (`WEB_DIST_DIR`): same origin, no cross-domain CORS and a single service to operate, next to PostgreSQL.
- **Multi-stage Docker image** (`node:22-alpine`) that builds the shared package, API and web app and keeps only what is needed at runtime, running as an unprivileged user.
- ~~Migrations on startup.~~ Superseded: migrations run separately as the table owner (`npm run db:deploy`, the `migrate` service), and the API runs with an unprivileged user ([ADR 0012](0012-unprivileged-database-role.md)).
- **`GET /api/health`** (public) checks that the database responds, for platform health checks.
- **Behind an HTTPS proxy** (`TRUST_PROXY=true`), so the real client IP is used for rate limiting and the `Secure` cookie works.
- The port comes from `API_PORT` or, if absent, `PORT`, the convention of most platforms.
- `docker-compose.prod.yml` starts the database and the app together for a demo or a self-hosted server.

## Alternatives considered

- **Web app on a CDN and a separate API:** it would need `SameSite=None` and credentialed CORS — more attack surface with no benefit for an internal gatehouse app.
- **Committing to one platform (Render, Fly…):** the image runs on any of them, and choosing one depends on the account it will be deployed to.

## Consequences

- In production, `/api/*` belongs to the API and every other route returns the web app.
- Serving the web app from another domain would require revisiting ADR 0004.
