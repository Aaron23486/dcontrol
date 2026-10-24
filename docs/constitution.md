# Constitution — reglas no negociables

## Principios de diseño
- **SOLID:** una responsabilidad por módulo; dependencias hacia interfaces; inyección de dependencias; sin clases «dios».
- **DRY:** lógica duplicada más de 2 veces se extrae. Una sola fuente de verdad para tipos, enums, validaciones y constantes (paquete `shared`).
- **Separation of Concerns:** UI / API / lógica de negocio / acceso a datos / autenticación separados.
- **Atomic Design (solo UI):** átomos → moléculas → organismos → templates → páginas. Los componentes no contienen reglas de negocio.
- **Clean Code:** funciones y componentes pequeños, nombres claros, tipado estricto, sin hardcoding, sin TODOs sin resolver, comentarios solo donde aporten valor.
- **Sin sobreingeniería:** no aplicar patrones complejos ni funcionalidades que no respondan a una necesidad real del proceso.

## Seguridad
- Contraseñas con hash seguro (argon2). Nunca en texto plano.
- Validación del lado servidor siempre, con esquemas compartidos.
- Autorización por rol en cada endpoint (guards). Usuario desactivado pierde acceso en la siguiente petición.
- Consultas parametrizadas (sin concatenar SQL). CORS restringido. Rate limit en login.
- Errores al usuario con formato `{ code, message }`, comprensibles y sin detalles internos ni stack traces.
- Variables de entorno; `.env.example` sin valores reales. Nunca subir secretos.
- Logs y auditoría sin datos sensibles innecesarios.

## Integridad de datos
- Las reglas críticas se garantizan en la base de datos (índices únicos parciales, `CHECK`), no solo en el código.
- Las migraciones son versionadas y reproducibles.

## Testing
- Toda regla de negocio crítica tiene test antes de darse por terminada.
- Pruebas de integración contra PostgreSQL real para integridad (visita abierta única).
- E2E del flujo de escaneo.
- Una tarea no está terminada si lint, tipos o tests fallan.

## Proceso
- Trabajo por fases, una tarea a la vez, con validación antes de avanzar.
- Decisión nueva → se escribe en `spec.md`, `plan.md` o `docs/decisions/` antes de implementarla.
- Si el código contradice la spec, se corrige uno de los dos; nunca se deja la discrepancia.
- No realizar cambios fuera del alcance autorizado de la tarea.
- Si existe un error de diseño o una solución superior, se indica claramente antes de ejecutar.
