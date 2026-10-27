# ADR 0001: Technology stack

**Status:** Accepted · 2026-10-23

## Context

CEDI Control is an internal gatehouse app: transactional, with several gatehouses writing at the same time, two roles and no need for SEO. It also had to be easy for anyone to clone and run locally.

## Decision

I chose TypeScript end to end, in a monorepo with npm workspaces (`apps/api`, `apps/web`, `packages/shared`):

- **API:** NestJS, for its modules, dependency injection and role guards.
- **Data:** PostgreSQL 17 with Prisma. What Prisma cannot model (partial indexes, `CHECK` constraints, `pg_trgm`) is written in SQL inside the migrations.
- **Web:** React with Vite and React Router, TanStack Query for server data, React Hook Form for forms and Tailwind for styling.
- **Validation:** Zod schemas in `@cedi/shared`, used by the forms and by the API.
- **Testing:** Vitest in every package, integration tests against real PostgreSQL and Playwright for end-to-end tests.
- **Local infrastructure:** docker-compose only for the database; GitHub Actions for CI.

## Alternatives considered

- **Full-stack Next.js:** SSR adds nothing to an internal app, and it would blur the line between UI and API.
- **Express without a framework:** I would have had to build dependency injection, modules and guards by hand.
- **Drizzle or TypeORM:** Drizzle's migrations were less mature; TypeORM's typing is weaker.
- **Jest alongside Vitest:** two test runners duplicate configuration; Vitest covers all three packages.

## Consequences

- Node ≥ 22.12 is supported (not only Node 24), because it is the most common installed version and every dependency supports it.
- `@cedi/shared` is compiled to CommonJS for the API; the web app consumes its source through a Vite alias.
- NestJS under Vitest is compiled with SWC to keep decorator metadata.
- The hand-written SQL constraints need integration tests, because Prisma does not know about them.
- npm 10 cannot resolve Vitest's optional peers from scratch inside workspaces; `npm ci` with the committed lockfile is unaffected, and the lockfile is regenerated with `npx npm@11 install`.
- `overrides.multer` in the root `package.json` forces a patched `multer` while `@nestjs/platform-express` pins a version with a security advisory; it can be removed once NestJS updates it.
