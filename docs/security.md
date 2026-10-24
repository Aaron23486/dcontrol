# Seguridad

Revisión de la Fase 11. Cada medida indica dónde está y qué prueba la cubre (ver también `docs/testing.md`).

## Medidas implementadas

| Área | Medida | Dónde / prueba |
|---|---|---|
| Contraseñas | argon2id con sal; mínimo 12 y máximo 128 caracteres (evita hashear entradas enormes) | `password-hasher.ts`, `shared/auth.ts` · `password-hasher.spec`, `shared/auth.test` |
| Login | Mensaje genérico para correo o contraseña incorrectos y mismo tiempo de respuesta aunque el correo no exista (evita descubrir cuentas) | `auth.service.ts` · `auth.http.spec` |
| Fuerza bruta | Límite de intentos de login por IP y minuto (`LOGIN_RATE_LIMIT_PER_MINUTE`, 5 por defecto); IP real detrás de un proxy con `TRUST_PROXY` | `auth.module.ts`, `app.setup.ts` · `auth.http.spec` |
| Sesión | JWT firmado en cookie `httpOnly` (inaccesible desde JavaScript), `SameSite=Strict` (CSRF) y `Secure` en producción; dura un turno (12 h) | `session-cookie.ts` · `auth.http.spec` |
| Revocación | Cada petición relee usuario, rol y estado en la BD: desactivar corta el acceso al instante (R14). Cambiar la contraseña o desactivar la cuenta invalida las sesiones abiertas (`sessions_valid_from`) | `auth.service.ts` · `accounts.int-spec` |
| Autorización | Guard global: todo exige sesión salvo login, logout y health. Roles con `@Roles` (la auditoría es solo para Admin). Nombre y cédula solo los corrige Admin | `session.guard.ts`, `roles.guard.ts` · `auth.http.spec`, `audit.http.int-spec`, `persons.http.int-spec`, E2E |
| Entrada | Toda entrada se valida en el servidor con los esquemas Zod compartidos; los ids de ruta, con `ParseUUIDPipe`; los campos desconocidos se descartan | controladores · pruebas de cada módulo |
| SQL | Prisma con consultas parametrizadas; no hay SQL construido con texto del usuario | revisión del código |
| Integridad | Reglas críticas garantizadas también en la BD (índice parcial, `CHECK`, únicos) | migraciones · `database-constraints.int-spec` |
| Errores | Formato `{ code, message }` sin detalles internos ni trazas; los errores 500 se registran en el servidor, no se envían | `api-exception.filter.ts` · `auth.http.spec` |
| Cabeceras | helmet: CSP `default-src 'self'`, HSTS, `nosniff`, `frame-ancestors 'self'`, sin `X-Powered-By` | `app.setup.ts` · `production.http.spec` |
| CORS | Solo el origen de la web (`WEB_ORIGIN`); en producción web y API comparten origen (ADR 0010) | `app.setup.ts` |
| Registros | Logs estructurados (pino) sin cookies ni cuerpos de petición; la auditoría guarda nombres de campos, nunca valores (D12) | `app.module.ts` · `audit.http.int-spec` |
| Secretos | Variables de entorno validadas al arrancar (`JWT_SECRET` ≥ 32 caracteres); `.env` fuera del repositorio; `.env.example` sin valores reales | `app-config.ts` · `app-config.spec` |
| Interfaz | Cerrar sesión o una sesión vencida descartan los datos en memoria y llevan al login | `session-state.ts` · E2E |
| Contenedor | Imagen multi-etapa, sin dependencias de desarrollo, ejecutada como usuario sin privilegios (`node`) | `Dockerfile` |
| Dependencias | `npm audit`: 0 vulnerabilidades; `overrides.multer` fuerza una versión corregida | `package.json` |

## Limitaciones conocidas

- **Cerrar sesión borra la cookie, pero no invalida el token en el servidor.** Si alguien copió la cookie antes, sigue valiendo hasta que expire (máximo 12 h), salvo que se cambie la contraseña o se desactive la cuenta. Es el compromiso habitual de las sesiones sin estado; se mitiga con `httpOnly`, la duración de un turno y la revocación descrita arriba.
- **El rate limit vive en memoria de cada instancia.** Con varias réplicas, cada una cuenta por separado; para escalar horizontalmente habría que usar un almacén compartido (por ejemplo Redis).
- **Los cambios de cuentas por terminal (`npm run users`) no quedan en la auditoría de la app,** porque no los hace un usuario de la app (ADR 0008). Quedan en el historial de la terminal del servidor.

## Al desplegar

1. Servir siempre con **HTTPS** y poner `TRUST_PROXY=true` si hay un proxy delante (necesario para la cookie `Secure` y la IP real).
2. Generar `JWT_SECRET` aleatorio (≥ 32 caracteres) y una contraseña fuerte para PostgreSQL. Cambiar `JWT_SECRET` cierra todas las sesiones.
3. Crear el primer administrador con `npm run create-admin` dentro del servidor y no reutilizar contraseñas.
4. Configurar copias de seguridad de la base de datos.
5. No ejecutar el seed de demostración (se niega en producción) ni exponer el puerto de PostgreSQL a Internet.
