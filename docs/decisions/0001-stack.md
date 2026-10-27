# 0001 — Technology stack

**Status:** APPROVED (2026-10-23)

## Context

An internal gatehouse app: transactional, several gatehouses writing at the same time, two roles, no SEO. It must be easy for a recruiter to clone and run (spec §29-31).

## Decision

All TypeScript in a monorepo with npm workspaces (`apps/api`, `apps/web`, `packages/shared`):

- **API:** NestJS (native modules, DI and role guards).
- **Data:** PostgreSQL 17 + Prisma. What Prisma does not model (partial indexes, `CHECK`, `pg_trgm`) goes in SQL inside the migrations.
- **Web:** React + Vite + React Router, TanStack Query, React Hook Form, Tailwind + Radix/shadcn.
- **Validation:** Zod schemas in `shared`, used in forms and in an API `ZodValidationPipe`.
- **Testing:** Vitest in every package, integration against real PostgreSQL, Playwright for e2e.
- **Local infrastructure:** docker-compose only for the database; GitHub Actions for lint, types and tests.

## Rejected alternatives

- **Full-stack Next.js:** SSR is not needed and it would mix UI and API, against the separation the spec asks for.
- **Express without a framework:** it would require building DI, modules and guards by hand.
- **Drizzle / TypeORM:** Drizzle is less mature for migrations; TypeORM has weaker typing.
- **Jest + Vitest:** two runners duplicate configuration; Vitest covers all three packages.

## Implementation notes (Phase 2)

- Node ≥ 22.12 instead of only 24: it is the most commonly installed version and every dependency supports it.
- The mature major versions were chosen (NestJS 11, Vite 7, React Router 7) instead of the newest just-released ones.
- `@cedi/shared` is compiled to CommonJS for the API; the web app consumes its source code through a Vite alias.
- npm 10 fails to resolve Vitest 4's optional peers from scratch inside workspaces. `npm ci` with the committed `package-lock.json` is not affected. To regenerate the lockfile, use `npx npm@11 install`.

- Phase 9: coverage with `@vitest/coverage-v8` and E2E with Playwright. `overrides.multer` in the root `package.json` forces `multer` ≥ 2.5.0 while `@nestjs/platform-express` pins a version with a security advisory; remove the override when NestJS updates it.

## Consequences

- NestJS with Vitest needs to compile with SWC to keep the decorator metadata.
- The hand-written SQL constraints must have integration tests, because Prisma does not know about them.
