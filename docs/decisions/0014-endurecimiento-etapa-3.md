# 0014 — Hardening: request limits, passwords, tokens and logs

**Status:** APPROVED (2026-10-25, remediation of the security audit, Stage 3: SEC-07, SEC-08, SEC-09, SEC-10, SEC-13, I1 and I3).

## Context

The audit left low and informational findings:

- Only login had a request limit; the rest of the API did not (SEC-07).
- A 12-character password such as "Password2024" was valid (SEC-08).
- The session does not expire on inactivity (SEC-09).
- Development PostgreSQL listened on all interfaces (SEC-10).
- Each request's log stored the query string, which carries names or ID numbers (SEC-13).
- The session token did not pin the algorithm, issuer or audience (I1), and the CSP allowed inline styles (I3).

## Decision

- **Request limit on the whole API (`api`)** with `API_RATE_LIMIT_PER_MINUTE` (300 by default). With a session it counts **per user**, because several gatehouses can reach the Internet through the same IP. Without a session it counts per IP. The per-IP login limit is kept as a second limit, applied only to the endpoint marked with `@LoginThrottle()`. The limit guard runs after the session and role guards so it knows the user.
- **Easy-to-guess passwords** (`guessablePasswordReason` in `@cedi/shared`). Rejected:
  - those that, without digits or symbols, are a very common word or sequence (including the system's name and "seguridad");
  - those with only digits or symbols;
  - those with fewer than 5 distinct characters;
  - those containing the person's name or email.
  - `npm run users` applies it, the only place where passwords are created or changed (ADR 0008).
- **Session token:** HS256, issuer `cedi-control-api` and audience `cedi-control-web`, required on verification.
- **Logs:** for each request only id, method, path without the query string, and IP are stored.
- **CSP:** styles and fonts only from the app itself (`'self'`), without `unsafe-inline`; the built web app uses no inline styles.
- **Development PostgreSQL:** published only on `127.0.0.1`.
- **SEC-09, accepted risk:** no inactivity timeout is added. The gatehouse screen polls the server every 10 s (ADR 0005), so the server cannot tell an attended gatehouse from an abandoned one, and a lock in the browser would interrupt scanning during the shift. The fixed one-shift duration (12 h), sign-out that revokes (SEC-01) and immediate deactivation (R14) are kept.

## Rejected alternatives

- **Querying a breached-password database on the Internet** (k-anonymity): adds an external dependency to account creation in an internal system. The 12-character minimum and the local rules cover the common cases.
- **A general per-IP limit:** it would cut off every gatehouse at the same site at once.
- **Sliding token expiration:** the automatic polling would always renew it, protecting nothing.

## Consequences

- On deployment, sessions issued before this change stop working (they carry no issuer or audience): each user signs in once.
- The limits still live in the instance's memory (same as in ADR 0013).
- An existing password that would be rejected today keeps working; the rules apply when it is created or changed.
- The common-word list is short and local: a reasonable defense, not an exhaustive one.
