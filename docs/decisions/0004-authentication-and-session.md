# ADR 0004: Authentication and session

**Status:** Accepted · 2026-10-23

## Context

Two roles, no public sign-up and no OAuth. A deactivated user must lose access on their very next request (R14).

## Decision

- Sign-in with email and password, hashed with argon2id.
- A signed JWT in an `httpOnly`, `SameSite=Strict` cookie (`Secure` in production). It lasts one shift (12 hours) and there is no refresh token.
- Every request reads the user's status and role from the database; the role inside the token is never used for authorization.
- Role guards on every endpoint, a rate limit on login and CORS restricted to the web origin.
- The first administrator is created from the terminal with `npm run create-admin`.

## Consequences

- One database query per request to verify the user, an acceptable cost at a gatehouse's volume.
- `SameSite=Strict` plus restricted CORS cover CSRF while web and API share the same site. If they ever move to separate domains, this decision has to be revisited.
