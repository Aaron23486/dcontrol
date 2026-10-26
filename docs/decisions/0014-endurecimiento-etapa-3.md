# 0014 — Endurecimiento: límite de peticiones, contraseñas, tokens y registros

**Estado:** APROBADO (2026-10-25, remediación de la auditoría de seguridad, Etapa 3: SEC-07, SEC-08, SEC-09, SEC-10, SEC-13, I1 e I3).

## Contexto
La auditoría dejó hallazgos bajos e informativos:
- Solo el login tenía límite de peticiones; el resto de la API no (SEC-07).
- Una contraseña de 12 caracteres como «Password2024» era válida (SEC-08).
- La sesión no vence por inactividad (SEC-09).
- PostgreSQL de desarrollo escuchaba en todas las interfaces (SEC-10).
- Los logs de cada petición guardaban la cadena de búsqueda, que lleva nombres o cédulas (SEC-13).
- El token de sesión no fijaba algoritmo, emisor ni audiencia (I1), y la CSP permitía estilos en línea (I3).

## Decisión
- **Límite de peticiones a toda la API (`api`)** con `API_RATE_LIMIT_PER_MINUTE` (300 por defecto). Con sesión cuenta **por usuario**, porque varias casetas pueden salir a Internet por la misma IP. Sin sesión cuenta por IP. El límite de login por IP se conserva como un segundo límite, aplicado solo al endpoint marcado con `@LoginThrottle()`. El guard de límites va después de los de sesión y rol para conocer al usuario.
- **Contraseñas fáciles de adivinar** (`guessablePasswordReason` en `@cedi/shared`). Se rechazan:
  - las que, sin números ni símbolos, son una palabra o secuencia muy usada (incluidos el nombre del sistema y «seguridad»);
  - las de solo números o símbolos;
  - las de menos de 5 caracteres distintos;
  - las que contienen el nombre o el correo de la persona.
  - Lo aplica `npm run users`, el único lugar donde se crean o cambian contraseñas (ADR 0008).
- **Token de sesión:** HS256, emisor `cedi-control-api` y audiencia `cedi-control-web`, exigidos al verificar.
- **Registros:** de cada petición se guardan solo id, método, ruta sin la cadena de búsqueda e IP.
- **CSP:** estilos y fuentes solo propios (`'self'`), sin `unsafe-inline`; la web compilada no usa estilos en línea.
- **PostgreSQL de desarrollo:** publicado solo en `127.0.0.1`.
- **SEC-09, riesgo aceptado:** no se agrega expiración por inactividad. La pantalla de la caseta consulta al servidor cada 10 s (ADR 0005), así que el servidor no distingue una caseta atendida de una abandonada, y un bloqueo en el navegador interrumpiría el escaneo durante el turno. Se mantienen la duración fija de un turno (12 h), el cierre de sesión que revoca (SEC-01) y la desactivación inmediata (R14).

## Alternativas descartadas
- **Consultar una base de contraseñas filtradas en Internet** (k-anonimato): agrega una dependencia externa a la creación de cuentas de un sistema interno. La longitud mínima de 12 y las reglas locales cubren los casos comunes.
- **Límite general por IP:** cortaría a todas las casetas de un mismo sitio a la vez.
- **Expiración deslizante del token:** las consultas automáticas la renovarían siempre, sin proteger nada.

## Consecuencias
- Al desplegar, las sesiones emitidas antes de este cambio dejan de valer (no traen emisor ni audiencia): cada usuario inicia sesión una vez.
- Los límites siguen en memoria de la instancia (igual que en ADR 0013).
- Una contraseña existente que hoy sería rechazada sigue funcionando; las reglas aplican al crearla o cambiarla.
- La lista de palabras comunes es corta y local: es una defensa razonable, no exhaustiva.
