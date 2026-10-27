# ADR 0014: Hardening — request limits, passwords, tokens and logs

**Status:** Accepted · 2026-10-25

## Context

The security review also left several low and informational findings:

- Only sign-in had a request limit; the rest of the API did not.
- A 12-character password such as "Password2024" was accepted.
- Sessions do not expire on inactivity.
- The development PostgreSQL listened on every network interface.
- Request logs stored the query string, which can contain names or ID numbers.
- The session token did not pin its algorithm, issuer or audience, and the content security policy allowed inline styles.

## Decision

- **A request limit on the whole API** (`API_RATE_LIMIT_PER_MINUTE`, 300 by default). With a session it counts **per user**, because several gatehouses can share one public IP; without a session it counts per IP. The stricter per-IP sign-in limit remains as a second limit, applied only to the sign-in endpoint. The limit guard runs after the session and role guards so it knows the user.
- **Guessable passwords are rejected** (`guessablePasswordReason` in `@cedi/shared`): very common words or sequences even with digits or symbols added, digits or symbols only, fewer than 5 distinct characters, or the person's name or email. It applies in `npm run users`, the only place where passwords are set.
- **Session token:** HS256 with issuer `cedi-control-api` and audience `cedi-control-web`, both required on verification.
- **Logs:** each request records only its id, method, path without the query string, and IP.
- **CSP:** styles and fonts only from the app itself (`'self'`), with no `unsafe-inline`.
- **Development PostgreSQL** is published only on `127.0.0.1`.
- **No inactivity timeout — an accepted risk.** The gatehouse screen polls the server every 10 seconds, so the server cannot tell an attended gatehouse from an abandoned one, and a lock in the browser would interrupt scanning mid-shift. The session keeps its fixed one-shift lifetime (12 hours), signing out revokes it, and deactivation is immediate.

## Alternatives considered

- **Checking passwords against an online breached-password service:** it adds an external dependency to account creation in an internal system; the 12-character minimum and the local rules cover the common cases.
- **A general per-IP limit:** it would block every gatehouse at the same site at once.
- **Sliding token expiration:** the automatic polling would keep renewing it, protecting nothing.

## Consequences

- Sessions issued before this change stopped working (no issuer or audience), so each user signed in once after the deployment.
- The limits still live in each instance's memory.
- Existing passwords that the new rules would reject keep working; the rules apply when a password is created or changed.
- The common-word list is short and local: a reasonable defense, not an exhaustive one.
