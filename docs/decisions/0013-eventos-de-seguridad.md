# 0013 — Security events and temporary per-account lockout

**Status:** APPROVED (2026-10-24, remediation of the security audit, Stage 2: SEC-04 and SEC-05).

## Context

The audit found that:

- Failed or successful logins, denied access and reached attempt limits were not recorded: an attack left no signal anyone could monitor (SEC-04).
- The login attempt limit was per IP only: an attack from many IPs against the same account was not slowed down (SEC-05).

## Decision

- **Security events in the structured log** (`SecurityEvents`, pino `security` context), with the `event` field:
  - `auth.login_succeeded`, `auth.login_failed` (reason: wrong password, unknown email or deactivated account), `auth.login_blocked`, `auth.account_locked`, `auth.logout`.
  - `auth.session_rejected` (an invalid, expired or revoked cookie was presented).
  - `auth.rate_limited` (per-IP limit) and `access.forbidden` (insufficient role).
  - `security.alert` (error level) when failed logins across the whole system exceed `SECURITY_ALERT_FAILED_LOGINS` within 10 minutes (20 by default), and `auth.account_locked` also at error level.
  - They carry IP, user or email, method and path **without the query string**; never passwords, tokens or cookies.
- **Temporary lockout per email** (`LoginAttempts`): after `LOGIN_MAX_FAILURES_PER_ACCOUNT` consecutive failures (5 by default) within `LOGIN_LOCKOUT_MINUTES` (15), the email is locked for that time, even if the correct password is used afterwards. It applies equally to emails that do not exist, so as not to reveal which accounts are real. A successful login clears the failures.
- **Alerts:** the app sends no emails or messages; the deployment platform's monitoring (or a `grep` for `"event":"security.alert"`) triggers the notification from the log.

## Rejected alternatives

- **Storing the events in the audit table:** the audit log is about the business (who recorded what) and the Administrator consults it; security events are operational, high-volume, and are monitored in the log.
- **Permanent lockout until an Administrator releases it:** anyone could lock a guard out by typing their email; the temporary lockout limits that abuse.
- **Counters in Redis:** unnecessary with a single instance (ADR 0010).

## Consequences

- Lockout and alert live in the instance's memory: they reset when the API restarts and, with several replicas, each counts separately (same as the per-IP limit).
- Someone who knows a guard's email can lock it for 15 minutes by failing on purpose; it is logged (`auth.account_locked`) and expires on its own.
- Account changes from the terminal (`npm run users`) remain outside these events and the audit log (ADR 0008); they stay in the server's terminal history.
