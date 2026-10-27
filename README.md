# CEDI Control

Control de ingreso y salida de personal externo en un centro de distribución (CEDI).

El guarda escribe la cédula de quien llega y pulsa Enter: el sistema reconoce a la persona y registra su **entrada** o su **salida** en segundos. Si la cédula es nueva, la registra junto con su primera entrada.

![Ingreso y salida](docs/screenshots/02-ingreso-y-salida.png)

## Descripción

En un CEDI entran cada día trabajadores de otras empresas, contratistas, técnicos de mantenimiento y visitantes. Sin un sistema, saber quién está dentro, desde cuándo y con qué herramientas depende de bitácoras en papel.

CEDI Control centraliza ese registro:

- Cada persona se registra una sola vez.
- Cada ingreso queda como una visita con hora de entrada y de salida.
- El guarda ve en todo momento quién está dentro.
- El administrador puede auditar cada cambio.

## Características

- **Ingreso y salida por cédula**, pensado para lector tipo teclado o tecleo manual:
  - Si la persona está dentro, se registra su salida automáticamente.
  - Si está fuera, se registra su entrada; al trabajador externo le basta un Enter.
  - Si la cédula es nueva, se registra a la persona y su primera entrada en una sola operación.
- **Datos según el tipo de persona:** contratistas, técnicos y visitantes indican motivo y área (prellenados con los de su visita anterior); los técnicos pueden registrar herramientas, que el sistema recuerda revisar al salir.
- **Protección contra errores de operación:**
  - Pide confirmación ante un doble escaneo (menos de 60 s).
  - Detecta visitas olvidadas de días anteriores y permite cerrarlas con la hora real.
  - Nunca permite dos entradas abiertas de la misma persona, ni con varias casetas a la vez.
- **Dashboard:** quién está dentro, entradas y salidas del día, visitas olvidadas y actividad reciente; se actualiza cada 10 segundos.
- **Historial** separado por tipo de persona, con filtros por fecha, estado y búsqueda.
- **Personas:** fichas, búsqueda sin importar tildes, empresas sin duplicados. Nombre y cédula solo los corrige un administrador.
- **Auditoría** solo para administradores: quién hizo qué y cuándo, sin guardar valores sensibles.
- **Accesible y responsive:**
  - WCAG 2.1 AA verificado automáticamente.
  - Funciona con teclado, en escritorio, laptop y tablet.
  - Sonido opcional para entrada, salida y error.

## Arquitectura

Monorepo TypeScript con tres paquetes:

```
packages/shared   Tipos, enums y esquemas Zod: una sola fuente de validación para web y API
apps/api          API REST NestJS + Prisma + PostgreSQL
apps/web          SPA React + Vite
e2e/              Pruebas de punta a punta con Playwright
```

- **API por módulos** (`auth`, `persons`, `companies`, `visits`, `dashboard`, `audit`, `health`): controlador (HTTP y validación) → servicio (reglas de negocio) → repositorio (acceso a datos). Autenticación y roles con guards globales; la auditoría es transversal.
- **Web por funcionalidades** (`scan`, `persons`, `history`, `dashboard`, `audit`) con Atomic Design (átomos, moléculas, organismos, plantillas). Los componentes no contienen reglas de negocio; la lógica vive en hooks y funciones probadas aparte.
- **Producción:** un contenedor donde la API sirve también la web compilada (mismo origen), más PostgreSQL.

Las decisiones están documentadas en [`docs/decisions/`](docs/decisions/README.md) (ADR) y en [`docs/plan.md`](docs/plan.md).

## Tecnologías

| Capa       | Tecnología                                                                    | Por qué                                                                |
| ---------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Lenguaje   | TypeScript estricto, Node.js ≥ 22.12                                          | Un solo lenguaje y tipos compartidos entre web y API                   |
| API        | NestJS 11                                                                     | Módulos, inyección de dependencias y guards por rol nativos            |
| Datos      | PostgreSQL 17 + Prisma 7                                                      | Índices parciales, `CHECK` y búsqueda trigram; migraciones versionadas |
| Validación | Zod 4 (paquete compartido)                                                    | El mismo esquema valida el formulario y la API                         |
| Web        | React 19, Vite 8, React Router 7, TanStack Query, React Hook Form, Tailwind 4 | Madurez, caché con sondeo en vivo y formularios tipados                |
| Seguridad  | argon2id, JWT en cookie `httpOnly`, helmet, rate limit                        | Ver [`docs/security.md`](docs/security.md)                             |
| Pruebas    | Vitest, Supertest, Playwright, axe                                            | Unitarias, integración contra PostgreSQL real y E2E con accesibilidad  |
| Entrega    | Docker multi-etapa, GitHub Actions                                            | Imagen reproducible y CI con lint, tipos, pruebas y cobertura          |

## Base de datos

```
companies 1──N persons 1──N visits 1──N visit_tools
companies 1──N visits          (empresa vigente al entrar)
users     1──N visits          (quién registró entrada y salida)
users     1──N audit_logs
```

| Tabla         | Contenido                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `persons`     | Nombre, cédula (única y normalizada), tipo y empresa vigente                                                    |
| `visits`      | Cada ingreso: hora de entrada y de salida, quién las registró, tipo y empresa **de ese momento**, motivo y área |
| `visit_tools` | Herramientas que ingresa un técnico en una visita                                                               |
| `companies`   | Empresas con nombre normalizado único («Acme S.A.» = «ACME SA»)                                                 |
| `users`       | Cuentas (Seguridad o Administrador) con contraseña argon2id                                                     |
| `audit_logs`  | Quién, qué acción, sobre qué registro y qué campos cambiaron (nunca valores)                                    |

Reglas garantizadas por la base de datos, no solo por el código:

- **Una persona nunca tiene dos visitas abiertas:** índice único parcial `WHERE exit_at IS NULL`.
- La salida no es anterior a la entrada.
- Quien registró la salida existe si y solo si hay hora de salida.
- Motivo y área presentes según el tipo de persona.
- Cédula única y normalizada.

Detalle completo en [`docs/plan.md`](docs/plan.md) §3 y en [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma).

## Instalación

Requisitos: **Node.js ≥ 22.12**, **npm** y **Docker** (para PostgreSQL).

```bash
git clone <url-del-repositorio> cedi-control
cd cedi-control
cp .env.example .env      # y completa los valores (ver Configuración)
npm install               # también compila el paquete compartido y genera el cliente de Prisma
npm run db:up             # PostgreSQL en Docker (crea también la base de pruebas)
npm run db:deploy         # aplica las migraciones y crea el usuario de la API (sin privilegios)
npm run create-admin      # crea el primer administrador
npm run dev               # API en :3000 y web en http://localhost:5173
```

## Configuración

Todas las variables están documentadas en [`.env.example`](.env.example). La API las valida al arrancar y no inicia si falta alguna.

| Variable                                                             | Para qué                                                                                                                               |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Base de datos de docker-compose                                                                                                        |
| `DATABASE_URL`                                                       | Conexión de la API a PostgreSQL, con un usuario sin privilegios que crea `db:deploy` (ADR 0012)                                        |
| `MIGRATION_DATABASE_URL`                                             | El dueño de las tablas: solo para aplicar migraciones (`db:deploy`, `db:migrate`)                                                      |
| `DATABASE_URL_TEST`                                                  | Base exclusiva para pruebas de integración y E2E (se vacía)                                                                            |
| `JWT_SECRET`                                                         | Firma de la sesión, mínimo 32 caracteres. Generar con `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `SESSION_TTL_HOURS`                                                  | Duración de la sesión (12 h, un turno)                                                                                                 |
| `WEB_ORIGIN`                                                         | URL de la web (CORS)                                                                                                                   |
| `CEDI_TIMEZONE`                                                      | Zona horaria IANA del CEDI: define qué es «hoy»                                                                                        |
| `LOGIN_RATE_LIMIT_PER_MINUTE`                                        | Intentos de login por IP y minuto                                                                                                      |
| `API_RATE_LIMIT_PER_MINUTE`                                          | Peticiones por minuto a toda la API, por usuario (o por IP sin sesión) (ADR 0014)                                                      |
| `LOGIN_MAX_FAILURES_PER_ACCOUNT`, `LOGIN_LOCKOUT_MINUTES`            | Bloqueo temporal de un correo tras varios intentos fallidos seguidos (ADR 0013)                                                        |
| `SECURITY_ALERT_FAILED_LOGINS`                                       | Logins fallidos en 10 minutos que generan el evento `security.alert` en el log (ADR 0013)                                              |
| `API_PORT` / `PORT`                                                  | Puerto de la API                                                                                                                       |
| `WEB_DIST_DIR`, `TRUST_PROXY`                                        | Producción: carpeta de la web compilada y uso detrás de un proxy HTTPS                                                                 |
| `E2E_BROWSER_CHANNEL`                                                | Opcional: `chrome` o `msedge` para usar el navegador instalado en las E2E                                                              |

Nunca subas `.env` al repositorio.

## Migraciones

```bash
npm run db:deploy    # migraciones pendientes + usuario de la API (desarrollo y producción)
npm run db:migrate   # crea una migración nueva tras cambiar schema.prisma (solo desarrollo)
npm run db:seed      # empresas de demostración (no crea usuarios; se niega en producción)
```

Algunas restricciones (índice parcial, `CHECK`, extensión `pg_trgm`) están en SQL dentro de las migraciones, porque Prisma no las expresa: hay que conservarlas.

## Usuario inicial

No hay registro público ni pantalla de usuarios. Las cuentas se gestionan desde la terminal del servidor:

```bash
npm run create-admin                            # primer administrador (pregunta los datos)
npm run users -- create                         # un guarda (rol Seguridad)
npm run users -- list
npm run users -- deactivate <correo>            # corta el acceso y cierra sus sesiones
npm run users -- activate <correo>
npm run users -- reset-password <correo>        # también cierra sus sesiones abiertas
```

`create-admin` también acepta `ADMIN_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` por variables de entorno. La contraseña nunca se imprime.

## Ejecución

**Desarrollo**

```bash
npm run dev          # API (watch) + web (Vite) en paralelo
```

**Pruebas y calidad**

```bash
npm run lint && npm run typecheck && npm run format:check
npm test                    # unitarias
npm run test:integration    # contra PostgreSQL real (requiere db:up)
npm run test:e2e            # Playwright: flujo de la caseta, roles, accesibilidad, tablet
npm run test:coverage       # unitarias + integración con umbrales mínimos
```

Hay más de 270 pruebas. Cobertura: API ≈ 97 % de líneas; lógica de la web ≈ 91 %. Qué prueba cubre cada regla: [`docs/testing.md`](docs/testing.md).

**Producción con Docker**

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml exec app npm run create-admin
```

La app queda en `http://localhost:8080` (`APP_PORT`). Antes de arrancarla, el servicio `migrate` aplica las migraciones con el dueño de las tablas y crea el usuario de la API (`APP_DB_USER`, `APP_DB_PASSWORD`), que no tiene privilegios de administración (ADR 0012). La app expone `GET /api/health` para los chequeos de salud. En otra plataforma, configura `npm run db:deploy` como paso previo al despliegue. En un servidor real, sírvela detrás de HTTPS con `TRUST_PROXY=true`. La imagen funciona en cualquier plataforma que acepte Docker.

## Capturas

|                                                                 |                                                                                           |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ![Login](docs/screenshots/01-login.png)                         | ![Persona nueva: técnico con herramientas](docs/screenshots/03-persona-nueva-tecnico.png) |
| ![Personas dentro](docs/screenshots/04-personas-dentro.png)     | ![Historial por tipo](docs/screenshots/05-historial.png)                                  |
| ![Personas por tipo](docs/screenshots/06-personas-por-tipo.png) | ![Auditoría](docs/screenshots/07-auditoria.png)                                           |

Se regeneran con `npm run screenshots`, usando datos de prueba.

## Decisiones técnicas

- **La cédula identifica a la persona** (no hay gafete), normalizada para que `1-234-567` y `1234567` sean la misma ([ADR 0008](docs/decisions/0008-cedula-sin-gafete.md)).
- **Persona y visita separadas:** los datos fijos se guardan una vez. Cada visita conserva el tipo y la empresa de ese momento, así el historial no cambia si alguien cambia de empresa.
- **Campos según el tipo de persona**, garantizados en la base de datos ([ADR 0009](docs/decisions/0009-campos-por-tipo.md)).
- **Reglas críticas en la base de datos:** el índice parcial impide dos visitas abiertas incluso con varias casetas a la vez ([ADR 0002](docs/decisions/0002-visita-abierta-unica.md)).
- **Estado calculado, no almacenado:** «dentro» equivale a `exit_at IS NULL`. Las fechas se guardan en UTC y «hoy» se calcula en la zona del CEDI ([ADR 0003](docs/decisions/0003-estado-calculado.md)).
- **Sesión en cookie `httpOnly` con verificación en cada petición:** desactivar una cuenta corta el acceso al instante ([ADR 0004](docs/decisions/0004-autenticacion.md)).
- **Escáner detrás de una interfaz:** hoy teclado o lector tipo teclado; mañana cámara, sin rediseñar ([ADR 0006](docs/decisions/0006-escaner.md)).
- **Sondeo cada 10 s** en lugar de WebSockets: suficiente para una caseta y sin infraestructura extra ([ADR 0005](docs/decisions/0005-tiempo-real-polling.md)).
- **Un solo contenedor en producción** ([ADR 0010](docs/decisions/0010-despliegue.md)).
- **Sistema de diseño propio:** colores, radios y sombras como tokens en un solo archivo, tipografía Inter autoalojada e íconos SVG propios, sin librería de componentes. En escritorio, «Ingreso y salida» cabe completa en la ventana ([ADR 0011](docs/decisions/0011-sistema-de-diseno.md)).

## Seguridad

- Contraseñas con **argon2id**; login con mensajes genéricos, tiempo constante y límite de intentos por IP.
- Sesión en cookie `httpOnly`, `SameSite=Strict` y `Secure` en producción. Rol y estado se verifican en cada petición. Cambiar la contraseña o desactivar la cuenta cierra las sesiones abiertas.
- Autorización por rol en cada endpoint (todo exige sesión salvo login, logout y health); la auditoría es solo para administradores.
- Validación de toda entrada en el servidor con esquemas compartidos; consultas parametrizadas (Prisma).
- Errores sin detalles internos; cabeceras de seguridad (CSP, HSTS…); CORS restringido.
- Logs sin cookies ni contraseñas; la auditoría guarda nombres de campos, no valores.
- Secretos solo en variables de entorno; contenedor sin privilegios; 0 vulnerabilidades conocidas en dependencias.

Detalle, limitaciones conocidas y recomendaciones de despliegue: [`docs/security.md`](docs/security.md).

## Futuras mejoras

- Lectura de cédula con la **cámara** de una tablet (nueva implementación de `ScannerSource`).
- **Exportar** el historial a CSV o Excel para reportes.
- **Pantalla de gestión de usuarios** para el administrador, si dejan de bastar los comandos de terminal.
- **Actualización en vivo con SSE** en lugar del sondeo cada 10 s, si crece el número de casetas.
- **Rate limit compartido** (Redis) para ejecutar varias réplicas de la API.
- **Catálogo de áreas** del CEDI para normalizar el campo «área».
