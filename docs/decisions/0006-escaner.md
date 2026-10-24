# 0006 — Escáner y operación de escaneo

**Estado:** APROBADO (2026-10-23). Enmendada por ADR 0008: la entrada es la cédula, no un gafete.

## Contexto
Hoy se usa un lector que actúa como teclado (escribe el código y envía Enter) y entrada manual; en el futuro, quizá cámara. La caseta debe operar con el mínimo de pasos.

## Decisión
- En la web, la entrada del escáner está detrás de una interfaz `ScannerSource`. Las implementaciones de hoy son lector-teclado y manual.
- La API expone una sola operación `POST /scans {identification}`, que decide el resultado: `EXIT_REGISTERED`, `ENTRY_PENDING`, `PERSON_NOT_FOUND`, `CONFIRMATION_REQUIRED` (D2) o `PREVIOUS_DAY_VISIT_OPEN` (D3). Con `confirmed: true` el guarda confirma un doble escaneo o una visita olvidada.
- La entrada se registra con `POST /visits` (persona existente o persona nueva junto con su primera entrada, en una transacción) y una visita olvidada se cierra con `PATCH /visits/:id/close` indicando la hora real de salida.
- Las reglas viven en el servicio `visits`, no en la UI: salida automática si hay visita abierta, confirmación si la operación anterior fue hace menos de 60 s (D2), y datos prellenados de la última visita (D1).

## Consecuencias
- Agregar cámara solo requiere otra implementación de `ScannerSource`.
- El flujo completo se cubre con e2e en Playwright.
