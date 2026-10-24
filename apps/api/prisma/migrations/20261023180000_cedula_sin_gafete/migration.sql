-- Enmienda 1 (ADR 0008): sin gafete; la cédula identifica a la persona.
-- Cada visita guarda la empresa y el tipo vigentes al entrar (R17).

-- Se elimina el gafete.
DROP INDEX "persons_badge_code_key";
ALTER TABLE "persons" DROP COLUMN "badge_code";

-- Cédula normalizada: solo letras mayúsculas y dígitos, 4 a 20 caracteres (D10).
ALTER TABLE "persons" ALTER COLUMN "identification" SET DATA TYPE VARCHAR(20);
-- Manual: formato de la cédula garantizado también en BD.
ALTER TABLE "persons" ADD CONSTRAINT "persons_identification_normalized"
  CHECK ("identification" ~ '^[A-Z0-9]{4,20}$');

-- Empresa y tipo por visita. Se agregan como opcionales, se rellenan desde la persona
-- para las visitas existentes y después se exige el tipo.
ALTER TABLE "visits" ADD COLUMN "company_id" UUID,
ADD COLUMN "person_type" "PersonType";

UPDATE "visits" AS v
SET "person_type" = p."type", "company_id" = p."company_id"
FROM "persons" AS p
WHERE p."id" = v."person_id";

ALTER TABLE "visits" ALTER COLUMN "person_type" SET NOT NULL;

CREATE INDEX "visits_company_id_idx" ON "visits"("company_id");

ALTER TABLE "visits" ADD CONSTRAINT "visits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Manual: igual que en persons (D9), la visita exige empresa salvo para visitantes.
ALTER TABLE "visits" ADD CONSTRAINT "visits_company_required_unless_visitor"
  CHECK ("person_type" = 'VISITOR' OR "company_id" IS NOT NULL);
