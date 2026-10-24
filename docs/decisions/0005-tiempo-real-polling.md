# 0005 — Tiempo real por polling

**Estado:** APROBADO (2026-10-23)

## Contexto
El dashboard y la lista de personas dentro deben reflejar lo que registran otras casetas.

## Decisión
TanStack Query consulta cada 10 s e invalida la caché justo después de cada operación local. SSE queda como mejora futura.

## Consecuencias
- Hasta 10 s de retraso para ver lo registrado en otra caseta; es aceptable para el proceso.
- Sin infraestructura extra (WebSockets, broker).
