# 0004 — Authentication and session

**Status:** APPROVED (2026-10-23)

## Context

Two roles, no public sign-up or OAuth. A deactivated user must lose access on their next request (R14).

## Decision

- Login with email and password; argon2 hashing.
- Signed JWT in an `httpOnly` cookie, `Secure` in production and `SameSite=Strict`. It lasts one shift (12 h) and there is no refresh token.
- Every request reads the user's `is_active` and role from the database. The role in the token is not used for authorization.
- Role guards on every endpoint; login rate limit; CORS restricted to the web origin.
- The first admin is created with `npm run create-admin` (D14).

## Consequences

- One query per request to verify the user: an acceptable cost at a gatehouse's volume.
- `SameSite=Strict` and restricted CORS cover CSRF as long as web and API share the site. If they move to separate domains, this decision must be revisited.
