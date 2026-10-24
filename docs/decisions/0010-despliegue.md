# 0010 — Despliegue en un contenedor

**Estado:** APROBADO (2026-10-23, Fase 11; dentro del stack delegado en la ADR 0001)

## Contexto
La app debe poder desplegarse y también clonarse y ejecutarse con facilidad (spec §6, §30, §31). La sesión usa una cookie `SameSite=Strict` (ADR 0004), que exige que la web y la API compartan sitio.

## Decisión
- **Un solo contenedor** con la API, que en producción sirve también la web compilada (`WEB_DIST_DIR`): mismo origen, sin CORS entre dominios y un único servicio que operar, más PostgreSQL.
- **Imagen Docker multi-etapa** (`node:22-alpine`): compila `shared`, API y web, y deja solo lo necesario para ejecutar. Corre como usuario sin privilegios.
- ~~**Migraciones al arrancar**~~ → sustituido por la ADR 0012: las migraciones se aplican aparte (`npm run db:deploy`, servicio `migrate`) con el dueño de las tablas, y la API opera con un usuario sin privilegios. El seed de demostración nunca corre en producción.
- **`GET /api/health`** (público) comprueba que la base de datos responde, para los chequeos de salud de la plataforma.
- **Detrás de un proxy con HTTPS** (`TRUST_PROXY=true`): Express toma la IP real del cliente (rate limit del login) y la cookie `Secure` funciona.
- El puerto se toma de `API_PORT` o, si no está, de `PORT` (la convención de la mayoría de las plataformas).
- `docker-compose.prod.yml` levanta base y app juntas para una demostración o un servidor propio.

## Alternativas descartadas
- **Web en un CDN y API aparte:** obligaría a usar `SameSite=None` y CORS con credenciales, más superficie de ataque, y no aporta nada a una app interna de una caseta.
- **Una plataforma concreta (Render, Fly…):** la imagen sirve para cualquiera; elegir una requiere las cuentas del responsable.

## Consecuencias
- En producción las rutas `/api/*` son de la API y cualquier otra ruta devuelve la web (SPA).
- Si algún día la web se sirve desde otro dominio, hay que revisar la ADR 0004.
