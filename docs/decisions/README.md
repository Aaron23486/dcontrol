# Decisiones (ADR)

Un archivo por decisión importante. Formato: Contexto → Decisión → Consecuencias.
Una decisión nueva o un cambio a una existente se registra aquí **antes** de implementarse.

| ADR | Decisión | Origen | Estado |
|---|---|---|---|
| [0001](0001-stack.md) | Stack TypeScript: NestJS + Prisma + PostgreSQL + React/Vite | plan §4 | APROBADO |
| [0002](0002-visita-abierta-unica.md) | Visita abierta única garantizada en BD | R1, plan §3 | APROBADO |
| [0003](0003-estado-calculado.md) | Estado de la visita calculado, no almacenado | D5, D6 | APROBADO |
| [0004](0004-autenticacion.md) | Sesión por cookie httpOnly con JWT de turno y verificación en BD | plan §4, R14 | APROBADO |
| [0005](0005-tiempo-real-polling.md) | Tiempo real por polling de 10 s | D11 | APROBADO |
| [0006](0006-escaner.md) | Escáner detrás de `ScannerSource` y operación única `POST /scans` | D1, D2, plan §7 | APROBADO |
| [0007](0007-gafete-y-catalogos.md) | Área, tipo y motivo como texto libre (la parte del gafete fue sustituida por 0008) | D7, D8 | APROBADO (enmendada) |
| [0008](0008-cedula-sin-gafete.md) | Identificación por cédula, sin gafete; historial con empresa y tipo por visita; usuarios por terminal | spec §5, §7, §9 | APROBADO |
| [0009](0009-campos-por-tipo.md) | Campos por tipo de persona; empresa obligatoria; sin «tipo de visita» | spec §7 | APROBADO |
| [0010](0010-despliegue.md) | Un contenedor con API y web; migraciones al arrancar | spec §6, §30 | APROBADO |
| [0011](0011-sistema-de-diseno.md) | Sistema de diseño: tokens, Inter, íconos propios y «Ingreso y salida» a pantalla completa | rediseño UI | APROBADO |
| [0012](0012-rol-de-base-de-datos.md) | La API opera con un rol de BD sin privilegios; migraciones aparte con el dueño de las tablas | SEC-02 | APROBADO |
| [0013](0013-eventos-de-seguridad.md) | Eventos de seguridad en el log con alerta y bloqueo temporal por cuenta | SEC-04, SEC-05 | APROBADO |
