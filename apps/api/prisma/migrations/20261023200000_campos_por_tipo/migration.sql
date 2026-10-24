-- ADR 0009: campos por tipo de persona y empresa obligatoria para todos.

-- D9: la empresa es obligatoria para los cuatro tipos. Se reemplazan los CHECK
-- que la exigían «salvo para visitantes» por NOT NULL.
ALTER TABLE "persons" DROP CONSTRAINT "persons_company_required_unless_visitor";
ALTER TABLE "visits" DROP CONSTRAINT "visits_company_required_unless_visitor";
ALTER TABLE "persons" ALTER COLUMN "company_id" SET NOT NULL;
ALTER TABLE "visits" ALTER COLUMN "company_id" SET NOT NULL;

-- D8: no existe «tipo de visita».
ALTER TABLE "visits" DROP COLUMN "visit_kind";

-- Manual: R18. Trabajador externo: sin motivo ni área. Los demás tipos: ambos obligatorios y no vacíos.
ALTER TABLE "visits" ADD CONSTRAINT "visits_fields_by_person_type" CHECK (
  CASE "person_type"
    WHEN 'EXTERNAL_WORKER' THEN "purpose" IS NULL AND "area" IS NULL
    ELSE btrim(COALESCE("purpose", '')) <> '' AND btrim(COALESCE("area", '')) <> ''
  END
);
