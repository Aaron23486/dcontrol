# ADR 0005: Polling for live data

**Status:** Accepted · 2026-10-23

## Context

The dashboard and the list of people inside must reflect what other gatehouses record.

## Decision

TanStack Query polls every 10 seconds and refreshes the cache right after each local operation. Server-sent events remain a possible future improvement.

## Consequences

- A change made at another gatehouse can take up to 10 seconds to appear, which is acceptable for the process.
- No extra infrastructure (WebSockets or a message broker) to deploy and operate.
