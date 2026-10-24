# 0009 — Campos por tipo de persona y empresa obligatoria

**Estado:** APROBADO (2026-10-23). Modifica D1, D8 y D9. Agrega R18 y R19.

## Contexto
El responsable del proyecto definió qué datos se piden para cada tipo de persona y pidió que la información de un tipo no se mezcle con la de otro (spec §7):

| Dato | Trabajador externo | Contratista | Mantenimiento / Técnico | Visitante |
|---|:---:|:---:|:---:|:---:|
| Nombre, cédula, empresa (persona) | Sí | Sí | Sí | Sí |
| Motivo y área (visita) | — | Obligatorios | Obligatorios | Obligatorios |
| Herramientas o equipos (visita) | — | — | Opcionales | — |

## Decisión
1. **Empresa obligatoria para todos (D9):** `persons.company_id` y `visits.company_id` son `NOT NULL`. Se eliminan los `CHECK` que la exigían «salvo para visitantes». Un visitante particular se registra con una empresa genérica, por ejemplo «Particular».
2. **Sin «tipo de visita» (D8):** se elimina la columna `visits.visit_kind`.
3. **Campos por tipo en la visita (R18), garantizados en BD:**
   - Contratista, técnico y visitante: `purpose` y `area` obligatorios y no vacíos.
   - Trabajador externo: `purpose` y `area` deben ser `NULL`. No se guarda información que no corresponde al tipo.
4. **Herramientas (R16, R19):** opcionales y solo para técnicos. Como es una regla entre `visits` y `visit_tools`, la valida el servicio de visitas (Fase 4) con su prueba. No se usa un trigger, para mantener la lógica en un solo lugar.
5. **Esquemas compartidos:** `@cedi/shared` define el esquema de la persona (nombre, cédula, empresa, tipo) y una unión discriminada por tipo para los datos de la visita. La web arma el formulario a partir de esos esquemas y la API valida con los mismos.
6. **Presentación separada por tipo:** las vistas de personas y visitas se dividen en secciones por tipo, cada una con sus propias columnas (spec §15).
7. **Prellenado (D1):** el motivo y el área de una nueva visita se proponen a partir de la visita anterior de esa persona.

## Consecuencias
- Migración `campos_por_tipo`: `company_id NOT NULL`, se elimina `visit_kind` y se agrega el `CHECK` por tipo. No rellena datos: si una base ya tuviera personas sin empresa o visitas sin motivo y área, la migración falla y hay que corregir esos datos a mano. Hoy no hay datos reales.
- Prisma no ejecuta cada migración dentro de una transacción, así que una migración que falla puede quedar a medias. Las migraciones nuevas que modifiquen datos o restricciones se envuelven en `BEGIN; … COMMIT;`, y las pruebas de integración dejan `cedi_test` vacía al terminar.
- Si la persona cambia de tipo, sus visitas anteriores siguen siendo válidas porque cada visita guarda su propio `person_type` (R17).
