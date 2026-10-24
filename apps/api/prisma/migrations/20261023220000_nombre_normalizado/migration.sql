-- D15: búsqueda de personas por nombre sin depender de tildes ni mayúsculas.
BEGIN;

ALTER TABLE "persons" ADD COLUMN "name_normalized" VARCHAR(150);

-- Relleno aproximado para filas existentes (la API recalcula el valor exacto al editar).
UPDATE "persons" SET "name_normalized" = upper("full_name") WHERE "name_normalized" IS NULL;

ALTER TABLE "persons" ALTER COLUMN "name_normalized" SET NOT NULL;

DROP INDEX "persons_full_name_trgm_idx";
CREATE INDEX "persons_name_normalized_trgm_idx" ON "persons" USING GIN ("name_normalized" gin_trgm_ops);

COMMIT;
