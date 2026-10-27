# 0005 — Real time through polling

**Status:** APPROVED (2026-10-23)

## Context

The dashboard and the list of people inside must reflect what other gatehouses record.

## Decision

TanStack Query polls every 10 s and invalidates the cache right after each local operation. SSE remains a future improvement.

## Consequences

- Up to 10 s of delay to see what another gatehouse recorded; acceptable for the process.
- No extra infrastructure (WebSockets, broker).
