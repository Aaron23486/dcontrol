# 0002 — Visita abierta única garantizada en BD

**Estado:** APROBADO (2026-10-23)

## Contexto
R1: una persona no puede tener dos visitas abiertas. Si dos casetas ingresan la misma cédula a la vez, una validación solo en código tiene condición de carrera.

## Decisión
- Índice único parcial `visits(person_id) WHERE exit_at IS NULL`.
- `CHECK (exit_at IS NULL OR exit_at >= entry_at)` (R11) y `CHECK ((exit_at IS NULL) = (exit_by IS NULL))` (R12).
- El servicio valida antes de insertar para dar un mensaje claro, y traduce la violación del índice (código `P2002`) a un error de negocio `{ code, message }`.

## Consecuencias
- Requiere pruebas de integración contra PostgreSQL real, incluida una prueba de concurrencia.
