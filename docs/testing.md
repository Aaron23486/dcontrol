# Pruebas

Cómo se prueba CEDI Control y qué prueba cubre cada exigencia del spec (§34) y cada regla del plan.

## Niveles

| Nivel | Herramienta | Qué cubre | Comando |
|---|---|---|---|
| Unitarias | Vitest | Esquemas compartidos, servicios con dependencias simuladas, lógica de la web | `npm test` |
| Integración | Vitest + PostgreSQL real (`DATABASE_URL_TEST`) | API completa por HTTP, restricciones de la BD, concurrencia | `npm run test:integration` |
| E2E | Playwright (Chromium) + axe | Flujo de la caseta en un navegador real, roles, sesión, accesibilidad WCAG 2.1 AA, tablet y teclado | `npm run test:e2e` |
| Cobertura | `@vitest/coverage-v8` | Unitarias + integración (API), con umbrales mínimos | `npm run test:coverage` |

Las pruebas de integración y E2E necesitan `npm run db:up`. Usan la base `cedi_test`, nunca la de desarrollo, y la dejan vacía al terminar. Las E2E levantan su propia API (:3100) y web (:5174), así que no chocan con `npm run dev`.

**Cobertura actual** (Fase 9): API 97 % de líneas / 86 % de ramas; `shared` 95 % / 100 %; lógica de la web 91 % / 90 %. Los componentes `.tsx` se cubren con las E2E. Umbrales: API ≥ 90 % / 80 %, `shared` ≥ 90 % / 90 %, web ≥ 85 % / 85 %.

## Spec §34 → pruebas

| Exigencia | Pruebas |
|---|---|
| **Personas:** crear persona | `persons.http.int-spec` «registra la persona con la cédula normalizada»; E2E «cédula nueva» |
| Buscar persona | `persons.http.int-spec` «secciones por tipo» (nombre sin tildes, prefijo de cédula, empresa); `persons.service.spec` |
| Validar identificación, formato y unicidad de la cédula | `shared/persons.test` (`identificationSchema`); `database-constraints.int-spec` «R13 y D10»; `persons.http.int-spec` «R13» |
| **Entradas:** registrar entrada | `visits.http.int-spec` «ciclo completo», «trabajador externo»; E2E «persona registrada» |
| Evitar doble entrada | `visits.http.int-spec` «R1» (incluida concurrencia de 5 casetas); `database-constraints.int-spec` «R1» |
| Persona registrada | `visits.http.int-spec` «salida y entrada de una persona registrada»; E2E «prellena motivo y área» |
| Persona no registrada | `visits.http.int-spec` «persona no registrada» (todo o nada); E2E «cédula nueva» |
| **Salidas:** registrar salida | `visits.http.int-spec` «ciclo completo», «D2»; E2E «doble escaneo», «técnico» |
| Evitar salida sin entrada | `visits.http.int-spec` «R2: no se puede cerrar una visita que ya tiene salida»; sin visita abierta el escaneo prepara una entrada («ciclo completo») |
| Cerrar correctamente la visita | `database-constraints.int-spec` «R11 y R12»; `visits.http.int-spec` «D3» (cierre manual validado y auditado) |
| **Autorización:** Seguridad no accede a funciones administrativas | `auth.http.spec` «autorización por rol»; `audit.http.int-spec` «Seguridad no puede consultar»; `persons.http.int-spec` «Seguridad no puede corregir el nombre»; E2E «Seguridad no ve ni puede abrir la auditoría» |
| El Administrador administra usuarios | `accounts.int-spec` (crear, desactivar, reactivar, restablecer contraseña contra la BD); `user-accounts.service.spec` |
| **Integridad:** nunca dos visitas abiertas | `database-constraints.int-spec` «R1» (índice parcial y concurrencia); `visits.http.int-spec` «R1» |

## Reglas del plan → pruebas

| Regla | Pruebas |
|---|---|
| R1 una visita abierta | `database-constraints.int-spec`, `visits.http.int-spec` |
| R2 sin salida sin entrada | `visits.http.int-spec` «R2» |
| R11 salida ≥ entrada · R12 `exit_by` ⇔ `exit_at` | `database-constraints.int-spec` |
| R13 cédula única | `database-constraints.int-spec`, `persons.http.int-spec`, `persons.service.spec` |
| R14 usuario desactivado pierde acceso | `auth.http.spec` (en memoria), `accounts.int-spec` (BD real) |
| R20 revocación de sesiones | `accounts.int-spec` «restablecer la contraseña cierra las sesiones», «desactivar y reactivar» |
| R15 último ADMIN activo | `user-accounts.service.spec`, `accounts.int-spec` |
| R16 / R19 herramientas solo para técnico | `shared/visits.test`, `visits.http.int-spec` «R18 y R19» |
| R17 la visita conserva tipo y empresa | `database-constraints.int-spec`, `visits.http.int-spec`, `persons.http.int-spec`, `history.http.int-spec` |
| R18 campos por tipo | `shared/visits.test`, `database-constraints.int-spec`, `visits.http.int-spec`, `web/visit-details-input.test` |
| D1 prellenado | `visits.http.int-spec` «ciclo completo»; E2E |
| D2 doble escaneo | `visits.http.int-spec` «D2»; E2E |
| D3 visita olvidada | `visits.http.int-spec` «D3»; `dashboard.http.int-spec`; E2E |
| D6 día del CEDI | `clock.spec` (medianoche y cambio de horario); `visits`, `dashboard`, `history` y `audit` int-spec |
| D9 empresa obligatoria y sin duplicados | `shared/persons.test`, `persons.http.int-spec` (incluida creación simultánea) |
| D10 cédula normalizada | `shared/persons.test`, `database-constraints.int-spec` |
| D12 auditoría sin valores, solo Admin | `audit.http.int-spec`, `persons.http.int-spec`; E2E |
| D13 quién corrige nombre y cédula | `persons.service.spec`, `persons.http.int-spec`, `shared/persons-update.test` |
| D15 búsqueda sin tildes | `persons.service.spec`, `persons.http.int-spec`, `history.http.int-spec` |
| Fase 7 herramientas al salir | `visits.http.int-spec`, `web/use-scan-flow.test`; E2E |
| Producción: web servida por la API, health, cabeceras (ADR 0010) | `production.http.spec`; `accounts.int-spec` «chequeo de salud» |
| Cierre de sesión | `web/session-state.test`; E2E «cerrar sesión vuelve al login» |
| Sesión vencida (R14 en la interfaz) | `web/query-client.test`; E2E «si la sesión vence a mitad del turno» |
| Accesibilidad (spec §28) | E2E `3-accessibility` (axe WCAG 2.1 A/AA en todas las pantallas), `4-responsive-and-keyboard` |
| Responsive (spec §27) | E2E `4-responsive-and-keyboard` (tablet sin desbordes, controles ≥ 40 px) |
| «Ingreso y salida» sin scroll de página en escritorio y actividad con scroll interno (spec §14, ADR 0011) | E2E `4-responsive-and-keyboard` «escritorio (1280 × 720)» y «(1920 × 1080)» |
