-- Migración inicial de CEDI Control (generada por Prisma y completada a mano).
-- Las secciones marcadas «Manual» no se pueden expresar en schema.prisma: no las borres.

-- Manual: búsqueda por similitud (índices trigram de nombres).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SECURITY', 'ADMIN');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('EXTERNAL_WORKER', 'CONTRACTOR', 'MAINTENANCE_TECHNICIAN', 'VISITOR');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "name_normalized" VARCHAR(150) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "identification" VARCHAR(30) NOT NULL,
    "type" "PersonType" NOT NULL,
    "company_id" UUID,
    "badge_code" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "entry_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exit_at" TIMESTAMPTZ(3),
    "entry_by" UUID NOT NULL,
    "exit_by" UUID,
    "purpose" VARCHAR(255),
    "area" VARCHAR(120),
    "visit_kind" VARCHAR(120),

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_tools" (
    "id" UUID NOT NULL,
    "visit_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(255),
    "quantity" INTEGER,

    CONSTRAINT "visit_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "entity" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "changed_fields" VARCHAR(64)[],
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_normalized_key" ON "companies"("name_normalized");

-- CreateIndex
CREATE INDEX "companies_name_normalized_trgm_idx" ON "companies" USING GIN ("name_normalized" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "persons_identification_key" ON "persons"("identification");

-- CreateIndex
CREATE UNIQUE INDEX "persons_badge_code_key" ON "persons"("badge_code");

-- CreateIndex
CREATE INDEX "persons_company_id_idx" ON "persons"("company_id");

-- CreateIndex
CREATE INDEX "persons_type_idx" ON "persons"("type");

-- CreateIndex
CREATE INDEX "persons_full_name_trgm_idx" ON "persons" USING GIN ("full_name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "visits_person_id_entry_at_idx" ON "visits"("person_id", "entry_at" DESC);

-- CreateIndex
CREATE INDEX "visits_entry_at_idx" ON "visits"("entry_at");

-- CreateIndex
CREATE INDEX "visit_tools_visit_id_idx" ON "visit_tools"("visit_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_entry_by_fkey" FOREIGN KEY ("entry_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_exit_by_fkey" FOREIGN KEY ("exit_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_tools" ADD CONSTRAINT "visit_tools_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Manual: R1. Una persona solo puede tener una visita abierta, también con varias casetas a la vez (ADR 0002).
CREATE UNIQUE INDEX "visits_one_open_per_person" ON "visits"("person_id") WHERE "exit_at" IS NULL;

-- Manual: R11. La salida no puede ser anterior a la entrada.
ALTER TABLE "visits" ADD CONSTRAINT "visits_exit_after_entry"
  CHECK ("exit_at" IS NULL OR "exit_at" >= "entry_at");

-- Manual: R12. Hay usuario de salida si y solo si hay hora de salida.
ALTER TABLE "visits" ADD CONSTRAINT "visits_exit_by_iff_exit_at"
  CHECK (("exit_at" IS NULL) = ("exit_by" IS NULL));

-- Manual: D9. La empresa es obligatoria salvo para visitantes.
ALTER TABLE "persons" ADD CONSTRAINT "persons_company_required_unless_visitor"
  CHECK ("type" = 'VISITOR' OR "company_id" IS NOT NULL);

-- Manual: la cantidad de una herramienta, si se indica, es positiva.
ALTER TABLE "visit_tools" ADD CONSTRAINT "visit_tools_quantity_positive"
  CHECK ("quantity" IS NULL OR "quantity" > 0);
