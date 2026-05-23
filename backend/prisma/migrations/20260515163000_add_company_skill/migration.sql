-- CreateTable
CREATE TABLE "company_skill" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "source" VARCHAR(50),
    "note" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_skill_company_id_skill_id_key" ON "company_skill"("company_id", "skill_id");

-- CreateIndex
CREATE INDEX "company_skill_company_id_idx" ON "company_skill"("company_id");

-- CreateIndex
CREATE INDEX "company_skill_skill_id_idx" ON "company_skill"("skill_id");

-- AddForeignKey
ALTER TABLE "company_skill" ADD CONSTRAINT "company_skill_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_skill" ADD CONSTRAINT "company_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
