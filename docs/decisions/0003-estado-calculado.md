# 0003 — Estado de la visita calculado

**Estado:** APROBADO (2026-10-23)

## Contexto
El spec define dos estados: DENTRO y SALIDA REGISTRADA. Guardarlos en una columna aparte duplicaría la información de `exit_at` y podría contradecirla.

## Decisión
- No hay columna de estado. `DENTRO` equivale a `exit_at IS NULL`; la API lo expone como campo calculado.
- Solo se guardan `entry_at` y `exit_at` en UTC. La fecha del día se obtiene con la zona horaria del CEDI (variable de entorno, D6).
- Las visitas olvidadas no generan un estado nuevo: se resaltan y se cierran manualmente, con auditoría (D3).

## Consecuencias
- Los filtros por día convierten a la zona del CEDI en la consulta; necesita pruebas con horas cercanas a medianoche.
