-- CreateTable
CREATE TABLE "SkillTaxonomyMapping" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "skill_id" UUID NOT NULL,
    "taxonomy_group" VARCHAR(200) NOT NULL,
    "taxonomy_subgroup" VARCHAR(200),
    "source" VARCHAR(50),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillTaxonomyMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillTaxonomyMapping_skill_id_idx" ON "SkillTaxonomyMapping"("skill_id");

-- CreateIndex
CREATE INDEX "SkillTaxonomyMapping_taxonomy_group_idx" ON "SkillTaxonomyMapping"("taxonomy_group");

-- CreateIndex
CREATE INDEX "SkillTaxonomyMapping_taxonomy_subgroup_idx" ON "SkillTaxonomyMapping"("taxonomy_subgroup");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTaxonomyMapping_skill_id_taxonomy_group_taxonomy_subgr_key" ON "SkillTaxonomyMapping"("skill_id", "taxonomy_group", "taxonomy_subgroup");

-- AddForeignKey
ALTER TABLE "SkillTaxonomyMapping" ADD CONSTRAINT "SkillTaxonomyMapping_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
