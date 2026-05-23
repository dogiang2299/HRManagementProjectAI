-- AddColumns
ALTER TABLE "Skill" ADD COLUMN "scope" VARCHAR(50) NOT NULL DEFAULT 'GLOBAL';
ALTER TABLE "Skill" ADD COLUMN "company_id" UUID;
ALTER TABLE "Skill" ADD COLUMN "is_verified" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Skill" ADD COLUMN "merged_to_skill_id" UUID;

-- CreateIndex
CREATE INDEX "Skill_scope_idx" ON "Skill"("scope");

-- CreateIndex
CREATE INDEX "Skill_company_id_idx" ON "Skill"("company_id");

-- CreateIndex
CREATE INDEX "Skill_merged_to_skill_id_idx" ON "Skill"("merged_to_skill_id");

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "InforCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_merged_to_skill_id_fkey" FOREIGN KEY ("merged_to_skill_id") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
