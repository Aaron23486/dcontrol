# 0013 — Eventos de seguridad y bloqueo temporal por cuenta

**Estado:** APROBADO (2026-10-24, remediación de la auditoría de seguridad, Etapa 2: SEC-04 y SEC-05).

## Contexto
La auditoría encontró que:
- No se registraban los inicios de sesión fallidos o correctos, los accesos denegados ni los límites de intentos alcanzados: un ataque no dejaba una señal que alguien pudiera vigilar (SEC-04).
- El límite de intentos de login era solo por IP: un ataque desde muchas IP contra una misma cuenta no se frenaba (SEC-05).

## Decisión
- **Eventos de seguridad en el log estructurado** (`SecurityEvents`, contexto `security` de pino), con el campo `event`:
  - `auth.login_succeeded`, `auth.login_failed` (motivo: contraseña incorrecta, correo desconocido o cuenta desactivada), `auth.login_blocked`, `auth.account_locked`, `auth.logout`.
  - `auth.session_rejected` (se presentó una cookie inválida, vencida o revocada).
  - `auth.rate_limited` (límite por IP) y `access.forbidden` (rol insuficiente).
  - `security.alert` (nivel error) cuando los logins fallidos de todo el sistema superan `SECURITY_ALERT_FAILED_LOGINS` en 10 minutos (20 por defecto), y `auth.account_locked` también en nivel error.
  - Llevan IP, usuario o correo, método y ruta **sin la cadena de búsqueda**; nunca contraseñas, tokens ni cookies.
- **Bloqueo temporal por correo** (`LoginAttempts`): tras `LOGIN_MAX_FAILURES_PER_ACCOUNT` fallos seguidos (5 por defecto) en `LOGIN_LOCKOUT_MINUTES` (15), el correo queda bloqueado ese tiempo, aunque luego se use la contraseña correcta. Aplica igual a correos que no existen, para no revelar cuáles son cuentas reales. Un login correcto borra los fallos.
- **Alertas:** la app no envía correos ni mensajes; el monitoreo de la plataforma de despliegue (o un `grep` de `"event":"security.alert"`) dispara la notificación a partir del log.

## Alternativas descartadas
- **Guardar los eventos en la tabla de auditoría:** la auditoría es de negocio (quién registró qué) y la consulta el Administrador; los eventos de seguridad son operativos, de mucho volumen, y se vigilan en el log.
- **Bloqueo permanente hasta que un Administrador lo libere:** permitiría a cualquiera dejar sin acceso a un guarda escribiendo su correo; el bloqueo temporal limita ese abuso.
- **Contadores en Redis:** innecesario con una sola instancia (ADR 0010).

## Consecuencias
- Bloqueo y alerta viven en memoria de la instancia: se reinician al reiniciar la API y, con varias réplicas, cada una cuenta por separado (igual que el límite por IP).
- Alguien que conozca el correo de un guarda puede bloquearlo 15 minutos fallando a propósito; queda registrado (`auth.account_locked`) y vence solo.
- Los cambios de cuentas por terminal (`npm run users`) siguen fuera de estos eventos y de la auditoría (ADR 0008); quedan en el historial de la terminal del servidor.
