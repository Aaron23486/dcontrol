# 0007 — Gafete como columna y catálogos como texto libre

**Estado:** APROBADO (2026-10-23). La parte del gafete queda **sustituida por ADR 0008** (no hay gafete).

## Contexto
El spec sugiere analizar las tablas `Badges` y de catálogos, pero no pide historial de gafetes ni catálogos administrables.

## Decisión
- ~~`persons.badge_code` es único. Los cambios de gafete se auditan (D7).~~ Sustituido por ADR 0008.
- Área y motivo son texto libre con longitud máxima, sin catálogos (D8). El «tipo de visita» se eliminó (ADR 0009).
- Empresa sí es una tabla, con nombre normalizado único y autocompletado. Es obligatoria para todos los tipos (D9, ADR 0009).

## Consecuencias
- Si se pide historial de gafetes o catálogos, se migra a tablas con un ADR nuevo.
