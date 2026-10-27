# Plan técnico

> **Estado: APROBADO (2026-10-23).** D1-D14, R11-R16 y el stack fueron aprobados por el responsable del proyecto.
> Cualquier cambio posterior se registra como ADR en `docs/decisions/` antes de implementarse.
> **Cambios aprobados el 2026-10-23:** ADR 0008 (la cédula identifica a la persona; usuarios por terminal) y ADR 0009 (campos por tipo de persona; empresa obligatoria). Afectan D1, D7, D8, D9, D10, D13, D14, R13, R15 y R16-R19.

## 1. Decisiones sobre ambigüedades del spec

| # | Tema | Decisión propuesta | Estado |
|---|---|---|---|
| D1 | Entrada rápida vs datos por visita | Al ingresar la cédula se muestra la ficha. Trabajador externo: un Enter confirma. Contratista, técnico y visitante: mini-formulario de motivo y área (y herramientas para el técnico), prellenado con los de su última visita, de modo que normalmente basta un Enter. | APROBADO (enmendada) |
| D2 | Doble escaneo accidental | Si pasan menos de 60 s desde la operación anterior de esa persona, se pide confirmación explícita antes de registrar la operación contraria. | APROBADO |
| D3 | Visitas olvidadas (sin salida) | Sin estado nuevo. Se resalta toda visita abierta de un día anterior. Seguridad o Admin puede cerrarla manualmente indicando hora de salida (auditado). Si la persona vuelve a escanear, se avisa de la visita pendiente y se ofrece cerrarla antes de abrir otra. | APROBADO |
| D4 | «Administrar roles» | Roles como enum (`SECURITY`, `ADMIN`). Significa asignar rol a un usuario. Sin tabla `roles`. | APROBADO |
| D5 | Estado de la visita | No se almacena. `DENTRO` equivale a `exit_at IS NULL`; la API lo expone como campo calculado. | APROBADO |
| D6 | «Fecha» de la visita | Solo `entry_at` y `exit_at` en UTC. La fecha se deriva con la zona horaria del CEDI (variable de entorno). | APROBADO |
| D7 | Identificador de búsqueda | La persona se busca por su cédula (`identification`); no existe otro código (ADR 0008). | APROBADO (enmendada) |
| D8 | Motivo y área | Texto libre con límite de longitud en v1. Sin catálogos. No existe «tipo de visita» (ADR 0009). | APROBADO (enmendada) |
| D9 | Empresa | Obligatoria para los cuatro tipos (`company_id NOT NULL` en `persons` y `visits`). Empresas creadas en línea con autocompletado y nombre normalizado único (ADR 0009). | APROBADO (enmendada) |
| D10 | Identificación (cédula) | Única y fija. Se teclea con números, letras y guiones; se guarda normalizada: mayúsculas, sin espacios, puntos ni guiones (así `1-234-567` y `1234567` son la misma persona). Entre 4 y 20 caracteres alfanuméricos tras normalizar. Sin lógica específica de país. | APROBADO (enmendada) |
| D11 | Tiempo real | Polling cada 10 s más invalidación de caché tras cada operación local. SSE como mejora futura. | APROBADO |
| D12 | Auditoría | Solo Admin la consulta. Se guarda usuario, acción, entidad, id, fecha y nombres de campos modificados (sin valores). | APROBADO |
| D13 | Edición de personas | Seguridad y Admin editan los datos que cambian (tipo, empresa). Cédula y nombre solo los corrige Admin. Todo cambio queda auditado y el cambio de tipo pide confirmación. No se borran personas con visitas. | APROBADO (enmendada) |
| D14 | Gestión de usuarios | Sin pantalla. Las cuentas se gestionan por terminal: `npm run users -- create` (rol SECURITY o ADMIN), `list`, `activate`, `deactivate` y `reset-password`. `npm run create-admin` sigue disponible como atajo. El seed no contiene datos sensibles. | APROBADO (enmendada) |
| D15 | Búsqueda de personas por nombre | Columna `persons.name_normalized` (sin tildes ni puntuación, en mayúsculas), calculada por la API con `normalizeSearchText` de `@cedi/shared` e indexada con trigram. Así «perez» encuentra a «Pérez». La cédula se busca por prefijo y la empresa por su `name_normalized`. | APROBADO (Fase 3) |

## 2. Reglas de negocio adicionales (se suman a R1-R10 del spec)

| # | Regla | Estado |
|---|---|---|
| R11 | `exit_at >= entry_at` | APROBADO |
| R12 | `exit_by` existe si y solo si `exit_at` existe | APROBADO |
| R13 | La identificación (cédula) es única | APROBADO (enmendada) |
| R14 | Un usuario desactivado pierde acceso en la siguiente petición | APROBADO |
| R15 | ~~Un admin no puede desactivarse a sí mismo~~ No aplica: no hay gestión de usuarios en la web. El comando `users` impide desactivar al último ADMIN activo. | APROBADO (enmendada) |
| R16 | Solo técnicos de mantenimiento pueden tener herramientas asociadas a la visita | APROBADO |
| R17 | Cada visita guarda la empresa y el tipo de persona vigentes al momento de la entrada; cambiar los datos de la persona no altera el historial | APROBADO |
| R18 | Contratista, técnico y visitante: motivo y área obligatorios en cada visita. Trabajador externo: la visita no lleva motivo ni área (garantizado en BD) | APROBADO |
| R19 | Las herramientas son opcionales para el técnico y no se admiten para los demás tipos (refuerza R16) | APROBADO |
| R20 | Cambiar la contraseña o desactivar una cuenta invalida sus sesiones abiertas (`users.sessions_valid_from`, Fase 11) | APROBADO |

## 3. Modelo de datos (PostgreSQL)

```
users        (id, name, email UQ, password_hash, role, is_active, sessions_valid_from, created_at, updated_at)
companies    (id, name, name_normalized UQ)
persons      (id, full_name, identification UQ, type, company_id FK, created_at, updated_at)
visits       (id, person_id FK, person_type, company_id FK, entry_at, exit_at null,
              entry_by FK users, exit_by FK users null, purpose null, area null)
visit_tools  (id, visit_id FK, name, description null, quantity null)
audit_logs   (id, user_id FK, action, entity, entity_id, changed_fields null, created_at)
```

Relaciones: empresa 1—N personas; empresa 1—N visitas (copia de la empresa vigente al entrar, R17); persona 1—N visitas; visita 1—N herramientas. Usuarios solo como autores (visitas y auditoría). Sin relaciones circulares.

Integridad en BD:
- Índice único parcial `visits(person_id) WHERE exit_at IS NULL` (R1, incluso con varias casetas concurrentes).
- `CHECK (exit_at IS NULL OR exit_at >= entry_at)`.
- `CHECK ((exit_at IS NULL) = (exit_by IS NULL))`.
- `company_id NOT NULL` en `persons` y `visits` (D9).
- `CHECK` de campos por tipo en `visits` (R18): motivo y área presentes y no vacíos salvo para trabajador externo, y ausentes para trabajador externo.
- `CHECK` de formato de cédula normalizada (D10).
- R16/R19 (herramientas solo para técnico) se valida en el servicio de visitas: es una regla entre tablas.

Índices de búsqueda: `persons(identification)`, `persons(company_id)`, `persons(type)`, trigram (`pg_trgm`) en `full_name` y `companies.name_normalized`, `visits(person_id, entry_at DESC)`, `visits(entry_at)`, `visits(company_id)`, parcial sobre visitas abiertas, `audit_logs(entity, entity_id)`, `(created_at)`, `(user_id)`.

## 4. Stack (todo TypeScript)

| Capa | Tecnología | Razón |
|---|---|---|
| Runtime | Node.js ≥ 22.12 (22 o 24 LTS), TypeScript 5.9 en modo `strict` | LTS; un solo lenguaje en API, web y `shared`. Desde 22.12 se puede usar la versión de Node más común. |
| Monorepo | npm workspaces: `apps/api`, `apps/web`, `packages/shared` | Un clone, un install. `shared` guarda enums y esquemas Zod (fuente única de validación). |
| Backend | NestJS | Modular, DI nativa, guards por rol. |
| ORM | Prisma | Migraciones versionadas y tipado. Índices parciales y `CHECK` en SQL dentro de migraciones. |
| BD | PostgreSQL 17 | Índices parciales, `CHECK`, trigram. Docker local o base gestionada. |
| Frontend | React + Vite + React Router | Madurez; app interna sin SEO, no requiere SSR. |
| Datos en UI | TanStack Query | Caché, polling e invalidación tras escaneo. |
| Formularios | React Hook Form + resolver de Zod | Reutiliza los esquemas de `shared`; campos dinámicos por tipo de persona. |
| UI | Tailwind + Radix/shadcn | Accesibilidad y teclado resueltos de base. |
| Validación | Zod compartido; en la API un `ZodValidationPipe` propio | Unión discriminada por tipo de persona, usada en formulario y API. |
| Auth | Cookie httpOnly + `SameSite=Strict` con JWT firmado que dura un turno (12 h, sin refresh token), `is_active` y rol leídos de BD en cada petición, argon2 | Desactivación inmediata sin la complejidad de refresh tokens. Sin OAuth. CORS restringido. Rate limit en login (`@nestjs/throttler`). |
| Logs | `nestjs-pino` | Logs estructurados sin datos sensibles. |
| Pruebas | Vitest en API, web y `shared` (un solo runner); integración con PostgreSQL real (Testcontainers o la BD de docker-compose); Playwright para e2e | Validar el índice parcial y el flujo de escaneo. |
| DevOps | docker-compose (solo BD), GitHub Actions (lint, tipos, tests), `.env.example`, ESLint + Prettier | Setup reproducible para un reclutador. |

Versiones mayores fijadas en Fase 2: NestJS 11, Prisma 7 (con `@prisma/adapter-pg`), React 19, Vite 7, React Router 7, Zod 4, Vitest 4 (≥ 4.1.12 por avisos de seguridad en versiones anteriores), ESLint 9. Las versiones exactas quedan en `package-lock.json`. Actualizado el 2026-10-26 (Fase 18): Vite 8.

Estado del stack: APROBADO (ver `docs/decisions/0001-stack.md`).

## 5. Arquitectura

- **Backend por módulo** (`auth`, `users`, `persons`, `companies`, `visits`, `dashboard`, `audit`): Controller (HTTP, DTO, guard) → Service (casos de uso y reglas) → Repository (datos). La lógica de entrada/salida vive en `visits`. La auditoría es transversal.
- **Frontend por features** (`scan`, `persons`, `visits`, `inside`, `users`, `audit`) con Atomic Design. El escáner está detrás de una interfaz `ScannerSource` (lector tipo teclado y entrada manual hoy; cámara mañana).

## 6. API (resumen)

```
POST /auth/login · POST /auth/logout · GET /auth/me
POST /scans {identification} → EXIT_REGISTERED | ENTRY_PENDING | PERSON_NOT_FOUND | CONFIRMATION_REQUIRED
POST /visits · PATCH /visits/:id/close · GET /visits · GET /visits/:id · GET /visits/inside
GET/POST/PATCH /persons · GET /persons/:id
GET/POST /companies
GET/POST/PATCH /users           (solo ADMIN)
GET /dashboard/summary
GET /audit                      (solo ADMIN)
```

Errores: `{ code, message }`, mensajes comprensibles, sin detalles internos.

## 7. Flujo de escaneo

```
Cédula tecleada (Enter) → POST /scans
 ├─ cédula no registrada → formulario de registro (tipo → campos dinámicos) → persona + 1ª entrada
 ├─ tiene visita abierta → salida automática (si fue hace <60 s, pide confirmación)
 └─ sin visita abierta → ficha + datos prellenados → Enter → ENTRADA registrada
```
