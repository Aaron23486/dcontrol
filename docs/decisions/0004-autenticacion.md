# 0004 — Autenticación y sesión

**Estado:** APROBADO (2026-10-23)

## Contexto
Dos roles, sin registro público ni OAuth. Un usuario desactivado debe perder el acceso en su siguiente petición (R14).

## Decisión
- Login con email y contraseña; hash con argon2.
- JWT firmado en cookie `httpOnly`, `Secure` en producción y `SameSite=Strict`. Dura un turno (12 h) y no hay refresh token.
- Cada petición lee `is_active` y el rol del usuario en la BD. El rol del token no se usa para autorizar.
- Guards por rol en cada endpoint; rate limit en login; CORS restringido al origen de la web.
- El primer admin se crea con `npm run create-admin` (D14).

## Consecuencias
- Una consulta por petición para verificar al usuario: es un costo aceptable con el volumen de una caseta.
- `SameSite=Strict` y CORS restringido cubren CSRF mientras web y API compartan sitio. Si se separan de dominio, hay que revisar esta decisión.
