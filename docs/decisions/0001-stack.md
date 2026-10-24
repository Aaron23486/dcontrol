# 0001 — Stack tecnológico

**Estado:** APROBADO (2026-10-23)

## Contexto
App interna de caseta: transaccional, varias casetas escribiendo a la vez, dos roles, sin SEO. Debe ser fácil de clonar y ejecutar por un reclutador (spec §29-31).

## Decisión
Todo TypeScript en un monorepo con npm workspaces (`apps/api`, `apps/web`, `packages/shared`):
- **API:** NestJS (módulos, DI y guards por rol nativos).
- **Datos:** PostgreSQL 17 + Prisma. Lo que Prisma no modela (índices parciales, `CHECK`, `pg_trgm`) va en SQL dentro de las migraciones.
- **Web:** React + Vite + React Router, TanStack Query, React Hook Form, Tailwind + Radix/shadcn.
- **Validación:** esquemas Zod en `shared`, usados en formularios y en un `ZodValidationPipe` de la API.
- **Pruebas:** Vitest en todos los paquetes, integración contra PostgreSQL real, Playwright para e2e.
- **Infra local:** docker-compose solo para la BD; GitHub Actions para lint, tipos y tests.

## Alternativas descartadas
- **Next.js full-stack:** no hace falta SSR y mezclaría UI y API, en contra de la separación que pide el spec.
- **Express sin framework:** obligaría a construir a mano DI, módulos y guards.
- **Drizzle / TypeORM:** Drizzle es menos maduro en migraciones; TypeORM tiene peor tipado.
- **Jest + Vitest:** dos runners duplican configuración; Vitest cubre los tres paquetes.

## Notas de implementación (Fase 2)
- Node ≥ 22.12 en lugar de solo 24: es la versión instalada con más frecuencia y todas las dependencias la admiten.
- Se eligieron las versiones mayores maduras (NestJS 11, Vite 7, React Router 7) en lugar de las más recientes recién publicadas.
- `@cedi/shared` se compila a CommonJS para la API; la web consume su código fuente mediante un alias de Vite.
- npm 10 falla al resolver desde cero los peer opcionales de Vitest 4 dentro de workspaces. `npm ci` con el `package-lock.json` versionado no se ve afectado. Para regenerar el lockfile, usa `npx npm@11 install`.

- Fase 9: cobertura con `@vitest/coverage-v8` y E2E con Playwright. `overrides.multer` en el `package.json` raíz fuerza `multer` ≥ 2.5.0 mientras `@nestjs/platform-express` fije una versión con aviso de seguridad; retirar el override cuando NestJS la actualice.

## Consecuencias
- NestJS con Vitest necesita compilar con SWC para conservar la metadata de decoradores.
- Las restricciones SQL a mano deben tener pruebas de integración, porque Prisma no las conoce.
