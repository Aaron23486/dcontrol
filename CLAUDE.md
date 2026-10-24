# CEDI — Control de Ingreso y Salida de Personal Externo

Aplicación web interna (portafolio). Flujo: ESCANEAR → IDENTIFICAR → REGISTRAR ENTRADA → DENTRO → ESCANEAR → REGISTRAR SALIDA.

## Antes de hacer cualquier cosa
1. Lee `docs/constitution.md` (reglas no negociables).
2. Lee la fase actual en `docs/tasks.md`.
3. Consulta `docs/spec.md` (requisitos) y `docs/plan.md` (decisiones técnicas) solo cuando la tarea los necesite.

Fuentes de verdad, en orden: `spec.md` > decisiones aprobadas en `plan.md` > `constitution.md`.
Si hay conflicto o falta información: pregunta. No asumas requisitos.

## Estado
Fase 1 (análisis) **aprobada** el 2026-10-23: D1-D14, R11-R16 y el stack de `docs/plan.md` están APROBADOS.
Fase 2 (base del proyecto) **aprobada** el 2026-10-23. Cada decisión importante tiene su ADR en `docs/decisions/`. Fase 3 (personas) **aprobada** el 2026-10-23. Fase 4 (ingreso y salida) **aprobada** el 2026-10-23. Fase 5 (dashboard) **aprobada** el 2026-10-23. Fase 6 (historial) **aprobada** el 2026-10-23. Fase 7 (herramientas) **aprobada** el 2026-10-23. Fase 8 (auditoría) **aprobada** el 2026-10-23. Fase 9 (testing) **aprobada** el 2026-10-23. Fase 10 (UI/UX) **aprobada** el 2026-10-23. Fase 11 (producción) **aprobada** el 2026-10-23: **el desarrollo planificado está completo**. Fase 12 (rediseño de la interfaz, ADR 0011) **aprobada** el 2026-10-23. Cambios nuevos: documentar primero en spec, plan o ADR y agregar sus pruebas a `docs/testing.md`.

## Reglas críticas (nunca violar)
- El campo «Persona que autoriza» NO existe en ninguna parte: ni formularios, ni API, ni BD, ni filtros, ni reportes. No sustituirlo por otro campo equivalente sin consultar.
- Solo dos roles (`SECURITY`, `ADMIN`). Sin registro público, sin OAuth. Sin pantalla de usuarios: se gestionan con `npm run users` (ADR 0008).
- No existe gafete: la persona se identifica por su cédula (spec §9, ADR 0008).
- Los datos que se piden y guardan dependen del tipo de persona (tabla de spec §7, ADR 0009). No pedir ni guardar campos que no correspondan al tipo. La empresa es obligatoria para todos.
- Sin lógica de negocio en componentes de UI. Colores, radios y sombras solo con los tokens de `apps/web/src/index.css` (ADR 0011); nada de colores sueltos.
- Toda regla de negocio lleva su test. Una persona nunca puede tener dos visitas abiertas (garantizado también en BD).
- No guardar secretos ni credenciales en el repo.

## Forma de trabajo
Por fase: analizar → explicar → identificar riesgos → implementar → probar → verificar que nada se rompió → resumir → indicar pendientes.
No avances de fase si hay una decisión arquitectónica sin resolver. Al cerrar una fase, actualiza `docs/tasks.md`.

## Comandos
Monorepo con npm workspaces (`packages/shared`, `apps/api`, `apps/web`). Node ≥ 22.12. Todo se ejecuta desde la raíz.

```
cp .env.example .env          # completar JWT_SECRET y contraseñas
npm install                   # también compila shared y genera el cliente Prisma
npm run db:up                 # PostgreSQL en Docker (crea también la BD <db>_test)
npm run db:deploy             # aplica migraciones   (db:migrate = crear una nueva en desarrollo)
npm run create-admin          # primer ADMIN (pregunta datos o usa ADMIN_* del .env)
npm run users -- list         # cuentas: list | create [--role SECURITY|ADMIN] | activate <correo>
                              #          | deactivate <correo> | reset-password <correo>
npm run db:seed               # empresas de demostración (no crea usuarios)
npm run dev                   # API :3000 (/api) + web :5173 con proxy
npm run lint | typecheck | test | format:check | build
npm run test:integration      # contra PostgreSQL real (DATABASE_URL_TEST); requiere db:up
npm run test:e2e              # Playwright: flujo de la caseta (API :3100 + web :5174, BD de pruebas); requiere db:up
npm run test:coverage         # unitarias + integración con umbrales de cobertura
npm run screenshots           # regenera docs/screenshots (Playwright, datos de prueba)
docker compose -f docker-compose.prod.yml --env-file .env up -d --build   # producción: app :8080 + BD
```

- Cambios al esquema: editar `apps/api/prisma/schema.prisma` y ejecutar `npm run db:migrate`. Las secciones «Manual» de las migraciones (índice parcial, CHECK, pg_trgm) se conservan siempre. Prisma no usa transacciones: envuelve en `BEGIN; … COMMIT;` las migraciones que cambian datos o restricciones.
- Enums en Prisma y en `@cedi/shared`: deben coincidir (lo verifica `enum-parity.spec.ts`).
- Seguridad (medidas, limitaciones, despliegue): `docs/security.md`. Despliegue: ADR 0010 y README.
- Qué prueba cubre cada regla: `docs/testing.md`. Toda regla nueva se agrega ahí con su prueba.
