# Seguridad

Revisión de la Fase 11. Cada medida indica dónde está y qué prueba la cubre (ver también `docs/testing.md`).

## Medidas implementadas

| Área | Medida | Dónde / prueba |
|---|---|---|
| Contraseñas | argon2id con sal; mínimo 12 y máximo 128 caracteres (evita hashear entradas enormes). Se rechazan las fáciles de adivinar: palabras o secuencias muy usadas aunque lleven números o símbolos, solo números, pocos caracteres distintos, o el nombre o correo de la persona (SEC-08, ADR 0014) | `password-hasher.ts`, `shared/auth.ts` · `password-hasher.spec`, `shared/auth.test` |
| Login | Mensaje genérico para correo o contraseña incorrectos y mismo tiempo de respuesta aunque el correo no exista (evita descubrir cuentas) | `auth.service.ts` · `auth.http.spec` |
| Fuerza bruta | Límite de intentos de login por IP y minuto (`LOGIN_RATE_LIMIT_PER_MINUTE`, 5 por defecto); IP real detrás de un proxy con `TRUST_PROXY`. Además, bloqueo temporal por correo tras 5 fallos seguidos (15 min), también para correos inexistentes (SEC-05, ADR 0013) | `rate-limit.ts`, `login-attempts.ts` · `auth.http.spec`, `login-attempts.spec`, `security.http.spec` |
| Consumo | Límite de peticiones a toda la API por usuario, o por IP sin sesión (`API_RATE_LIMIT_PER_MINUTE`, 300 por defecto); varias casetas detrás de la misma IP no se afectan entre sí (SEC-07, ADR 0014) | `rate-limit.ts` · `security.http.spec` «SEC-07» |
| Sesión | JWT firmado en cookie `httpOnly` (inaccesible desde JavaScript), `SameSite=Strict` (CSRF) y `Secure` en producción; dura un turno (12 h). Solo se aceptan tokens HS256 con el emisor y la audiencia de la app (I1) | `session-cookie.ts`, `auth.module.ts` · `auth.http.spec`, `security.http.spec` «I1» |
| Revocación | Cada petición relee usuario, rol y estado en la BD: desactivar corta el acceso al instante (R14). Cambiar la contraseña, desactivar la cuenta o **cerrar sesión** invalida las sesiones abiertas en el servidor (`sessions_valid_from`, SEC-01): una copia de la cookie deja de valer | `auth.service.ts` · `accounts.int-spec`, `auth.http.spec` «SEC-01» |
| Autorización | Guard global: todo exige sesión salvo login, logout y health. Roles con `@Roles` (la auditoría es solo para Admin). Nombre y cédula solo los corrige Admin | `session.guard.ts`, `roles.guard.ts` · `auth.http.spec`, `audit.http.int-spec`, `persons.http.int-spec`, E2E |
| Entrada | Toda entrada se valida en el servidor con los esquemas Zod compartidos; los ids de ruta, con `ParseUUIDPipe`; los campos desconocidos se descartan | controladores · pruebas de cada módulo |
| SQL | Prisma con consultas parametrizadas; no hay SQL construido con texto del usuario | revisión del código |
| Integridad | Reglas críticas garantizadas también en la BD (índice parcial, `CHECK`, únicos). El cierre manual con hora indicada por el guarda solo aplica a visitas de días anteriores (D3, SEC-03) | migraciones · `database-constraints.int-spec`, `visits.http.int-spec` «SEC-03» |
| Base de datos | La API usa un usuario sin privilegios (rol `cedi_app`): sin DELETE, TRUNCATE ni DDL; la auditoría y la entrada de cada visita son inmutables para ella. Las migraciones las aplica el dueño de las tablas por separado (ADR 0012, SEC-02) | migración `rol_de_aplicacion` · `privileges.int-spec`, E2E con el usuario sin privilegios |
| Errores | Formato `{ code, message }` sin detalles internos ni trazas; los errores 500 se registran en el servidor, no se envían. Un cuerpo demasiado grande responde 413 y uno mal formado 400, sin registrarse como error (SEC-06) | `api-exception.filter.ts` · `auth.http.spec`, `security.http.spec` |
| Eventos de seguridad | Log estructurado `security`: logins correctos y fallidos, bloqueos, cierres de sesión, sesiones rechazadas, accesos denegados y límites alcanzados, sin contraseñas, tokens ni la cadena de búsqueda; alerta `security.alert` ante muchos fallos en 10 min (SEC-04, ADR 0013) | `security-events.ts`, `api-exception.filter.ts` · `security-events.spec`, `security.http.spec` |
| Cabeceras | helmet: CSP `default-src 'self'`, scripts, estilos y fuentes solo propios y sin `unsafe-inline` (I3), HSTS, `nosniff`, `frame-ancestors 'self'`, sin `X-Powered-By` | `app.setup.ts` · `production.http.spec` |
| CORS | Solo el origen de la web (`WEB_ORIGIN`); en producción web y API comparten origen (ADR 0010) | `app.setup.ts` |
| Registros | Logs estructurados (pino): de cada petición solo id, método, ruta sin la cadena de búsqueda e IP; sin encabezados, cookies, parámetros ni cuerpos (SEC-13). La auditoría guarda nombres de campos, nunca valores (D12) | `request-log.ts`, `app.module.ts` · `request-log.spec`, `audit.http.int-spec` |
| Secretos | Variables de entorno validadas al arrancar (`JWT_SECRET` ≥ 32 caracteres); en producción se rechazan los valores de ejemplo de `.env.example` (SEC-12); `.env` fuera del repositorio; `.env.example` sin valores reales | `app-config.ts` · `app-config.spec` |
| Interfaz | Cerrar sesión o una sesión vencida descartan los datos en memoria y llevan al login | `session-state.ts` · E2E |
| Contenedor | Imagen multi-etapa, sin dependencias de desarrollo, ejecutada como usuario sin privilegios (`node`). En desarrollo, PostgreSQL solo escucha en `127.0.0.1` (SEC-10) | `Dockerfile`, `docker-compose.yml` |
| Dependencias | `npm audit`: 0 vulnerabilidades; `overrides.multer` fuerza una versión corregida. Instalaciones reproducibles desde `package-lock.json` (`npm ci` en CI y en la imagen). El CI falla ante vulnerabilidades altas o críticas, y Dependabot propone actualizaciones semanales como PR revisables (SEC-11, ADR 0015) | `package.json`, `.github/workflows/ci.yml` «supply-chain», `.github/dependabot.yml` |
| Secretos en Git | gitleaks revisa **todo el historial** en cada push y PR, sin mostrar valores (`--redact`); las acciones de GitHub están fijadas por commit y el workflow solo tiene permiso de lectura (SEC-11, ADR 0015) | `.github/workflows/ci.yml` «supply-chain» |

## Limitaciones conocidas

- **Cerrar sesión cierra todas las sesiones de esa cuenta** (SEC-01), también las de otra caseta que use la misma cuenta. Es el precio de revocar sin guardar cada sesión en la base; con cuentas por guarda no afecta.
- **El superusuario de PostgreSQL sigue existiendo** dentro del contenedor de la base: lo usan solo las migraciones (ADR 0012). No publiques el puerto de la base en producción.
- **Sin expiración por inactividad (SEC-09, riesgo aceptado, ADR 0014).** La sesión dura un turno fijo de 12 h. La pantalla de la caseta se actualiza sola cada 10 s, así que el servidor no puede distinguir una caseta inactiva de una atendida; cerrar sesión al cambiar de turno es parte del procedimiento.
- **La lista de contraseñas comunes es corta y local (SEC-08).** No consulta bases de contraseñas filtradas en Internet; la longitud mínima de 12 hace la mayor parte del trabajo.
- **El rate limit, el bloqueo por correo y la alerta viven en memoria de cada instancia.** Se reinician con la API y, con varias réplicas, cada una cuenta por separado; para escalar horizontalmente habría que usar un almacén compartido (por ejemplo Redis).
- **El bloqueo por correo se puede provocar a propósito:** quien conozca el correo de un guarda puede dejarlo 15 minutos sin poder entrar. Queda registrado (`auth.account_locked`) y vence solo (ADR 0013).
- **Los cambios de cuentas por terminal (`npm run users`) no quedan en la auditoría de la app,** porque no los hace un usuario de la app (ADR 0008). Quedan en el historial de la terminal del servidor.

## Al desplegar

1. Servir siempre con **HTTPS** y poner `TRUST_PROXY=true` si hay un proxy delante (necesario para la cookie `Secure` y la IP real).
2. Generar `JWT_SECRET` aleatorio (≥ 32 caracteres) y una contraseña fuerte para PostgreSQL. Cambiar `JWT_SECRET` cierra todas las sesiones.
3. Crear el primer administrador con `npm run create-admin` dentro del servidor y no reutilizar contraseñas.
4. Generar **todos** los secretos de producción nuevos (no reutilizar los de desarrollo ni guardarlos en carpetas sincronizadas como OneDrive) y usar contraseñas distintas y generadas para `POSTGRES_PASSWORD` (dueño de las tablas) y `APP_DB_PASSWORD` (usuario de la API), y aplicar las migraciones con `npm run db:deploy` (servicio `migrate`), nunca con el usuario de la API.
5. Configurar copias de seguridad de la base de datos.
6. No ejecutar el seed de demostración ni `e2e:prepare` (ambos se niegan en producción) ni exponer el puerto de PostgreSQL a Internet.
7. Configurar una alerta del monitoreo sobre los eventos `security.alert` y `auth.account_locked` del log (ADR 0013).
