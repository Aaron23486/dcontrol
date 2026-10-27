# CEDI — Control de Ingreso y Salida de Personal Externo

Aplicación web interna (portafolio). Flujo: ESCANEAR → IDENTIFICAR → REGISTRAR ENTRADA → DENTRO → ESCANEAR → REGISTRAR SALIDA.

## Antes de hacer cualquier cosa
1. Lee `docs/requirements.md` (requisitos, reglas R1-R20) y `docs/architecture.md` (principios, arquitectura, decisiones D1-D15) cuando la tarea los necesite.
2. Revisa el ADR correspondiente en `docs/decisions/` antes de cambiar una decisión existente.

Fuentes de verdad, en orden: `docs/requirements.md` > ADR y decisiones de `docs/architecture.md` > principios de `docs/architecture.md`.
Si hay conflicto o falta información: pregunta. No asumas requisitos.

## Estado
Producto completo; en preparación para portafolio con el estándar PSES 2.0 (README y `docs/` en inglés; este archivo sigue en español a propósito). Historial por etapas en `CHANGELOG.md`. Versión **1.0.0** (2026-10-27). El repositorio sigue privado a propósito: el responsable lo hará público cuando las 4 apps del portafolio estén listas; entonces hay que activar la protección de `main`, el escaneo de secretos y la protección de push (no disponibles en privado con el plan gratuito).
Cambios nuevos: documentar primero en `docs/requirements.md`, `docs/architecture.md` o un ADR nuevo, y agregar sus pruebas a `docs/testing.md`. Las referencias en código usan los IDs estables (FR-n, NFR-n, Rn, Dn, SEC-nn).

## Reglas críticas (nunca violar)
- El campo «Persona que autoriza» NO existe en ninguna parte: ni formularios, ni API, ni BD, ni filtros, ni reportes. No sustituirlo por otro campo equivalente sin consultar.
- Solo dos roles (`SECURITY`, `ADMIN`). Sin registro público, sin OAuth. Sin pantalla de usuarios: se gestionan con `npm run users` (ADR 0008).
- No existe gafete: la persona se identifica por su cédula (FR-4, ADR 0008).
- Los datos que se piden y guardan dependen del tipo de persona (tabla de FR-2, ADR 0009). No pedir ni guardar campos que no correspondan al tipo. La empresa es obligatoria para todos.
- Sin lógica de negocio en componentes de UI. Colores, radios y sombras solo con los tokens de `apps/web/src/index.css` (ADR 0011); nada de colores sueltos.
- Toda regla de negocio lleva su test. Una persona nunca puede tener dos visitas abiertas (garantizado también en BD).
- No guardar secretos ni credenciales en el repo.

## Forma de trabajo
Por fase: analizar → explicar → identificar riesgos → implementar → probar → verificar que nada se rompió → resumir → indicar pendientes.
No avances de fase si hay una decisión arquitectónica sin resolver. Al cerrar una unidad, actualiza `CHANGELOG.md` si el cambio es notable.

## Comandos
Monorepo con npm workspaces (`packages/shared`, `apps/api`, `apps/web`). Node ≥ 22.12. Todo se ejecuta desde la raíz.

```
cp .env.example .env          # completar JWT_SECRET y contraseñas
npm ci                        # versiones exactas del lockfile; también compila shared y el cliente Prisma
npm run db:up                 # PostgreSQL en Docker (crea también la BD <db>_test)
npm run db:deploy             # migraciones + usuario de la API sin privilegios (ADR 0012); db:migrate = crear una nueva
npm run create-admin          # primer ADMIN (pregunta datos o usa ADMIN_* del .env)
npm run users -- list         # cuentas: list | create [--role SECURITY|ADMIN] | activate <correo>
                              #          | deactivate <correo> | reset-password <correo>
npm run db:seed               # empresas de demostración (no crea usuarios)
npm run demo:setup            # cuentas @demo.cedi.test (una por rol, contraseñas generadas mostradas
                              # una vez) y datos ficticios; se niega en producción (ADR 0016)
npm run dev                   # API :3000 (/api) + web :5173 con proxy
npm run lint | typecheck | test | format:check | build
npm run test:integration      # contra PostgreSQL real (DATABASE_URL_TEST); requiere db:up
npm run test:e2e              # Playwright: flujo de la caseta (API :3100 + web :5174, BD de pruebas); requiere db:up
npm run test:coverage         # unitarias + integración con umbrales de cobertura
npm run screenshots           # regenera docs/screenshots (Playwright, datos de prueba)
docker compose -f docker-compose.prod.yml --env-file .env up -d --build   # producción: app :8080 + BD
```

- Cambios al esquema: editar `apps/api/prisma/schema.prisma` y ejecutar `npm run db:migrate`. Las secciones «Manual» de las migraciones (índice parcial, CHECK, pg_trgm) se conservan siempre. Prisma no usa transacciones: envuelve en `BEGIN; … COMMIT;` las migraciones que cambian datos o restricciones.
- La API opera con el rol `cedi_app`, sin DELETE ni DDL (ADR 0012). Toda tabla o columna nueva que la API escriba necesita su `GRANT` a `cedi_app` en la misma migración; las E2E fallan si falta. Las migraciones usan `MIGRATION_DATABASE_URL` (dueño de las tablas), la API `DATABASE_URL`.
- Enums en Prisma y en `@cedi/shared`: deben coincidir (lo verifica `enum-parity.spec.ts`).
- Seguridad (medidas, limitaciones, despliegue): `docs/security.md`. Despliegue: ADR 0010 y README.
- Qué prueba cubre cada regla: `docs/testing.md`. Toda regla nueva se agrega ahí con su prueba.
