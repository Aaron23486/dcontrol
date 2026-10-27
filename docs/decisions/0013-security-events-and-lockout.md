# ADR 0013: Security events and temporary account lockout

**Status:** Accepted · 2026-10-24

## Context

The security review found two gaps:

- Failed and successful sign-ins, denied access and reached limits were not recorded, so an attack left no signal anyone could monitor.
- The sign-in limit was per IP only, so an attack on one account from many IPs was not slowed down.

## Decision

- **Security events in the structured log** (pino `security` context, `event` field):
  - `auth.login_succeeded`, `auth.login_failed` (wrong password, unknown email or deactivated account), `auth.login_blocked`, `auth.account_locked`, `auth.logout`.
  - `auth.session_rejected` (an invalid, expired or revoked cookie), `auth.rate_limited` (per-IP limit) and `access.forbidden` (insufficient role).
  - `security.alert` at error level when failed sign-ins across the system exceed `SECURITY_ALERT_FAILED_LOGINS` within 10 minutes (20 by default); `auth.account_locked` is also logged at error level.
  - Events carry IP, user or email, method and path **without the query string** — never passwords, tokens or cookies.
- **Temporary lockout per email:** after `LOGIN_MAX_FAILURES_PER_ACCOUNT` consecutive failures (5 by default), the email is locked for `LOGIN_LOCKOUT_MINUTES` (15), even if the right password is used afterwards. It applies equally to emails that do not exist, so the response never reveals which accounts are real. A successful sign-in clears the counter.
- **Alerting** happens outside the app: the deployment platform's monitoring (or a search for `"event":"security.alert"`) turns these log events into notifications.

## Alternatives considered

- **Storing the events in the audit table:** the audit log is about the business (who recorded what) and is read by Administrators; security events are operational and high-volume, and belong in the log.
- **Permanent lockout until an Administrator releases it:** anyone could lock a guard out just by typing their email; a temporary lockout limits that abuse.
- **Counters in Redis:** unnecessary with a single instance.

## Consequences

- Lockout and alert counters live in memory: they reset when the API restarts and are counted per instance if there are several replicas, like the per-IP limit.
- Someone who knows a guard's email can lock it for 15 minutes on purpose; it is logged and expires on its own.
