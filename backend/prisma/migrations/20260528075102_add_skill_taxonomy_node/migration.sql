-- CreateEnum
CREATE TYPE "SkillTaxonomyNodeType" AS ENUM ('GROUP', 'SUBGROUP');

-- AlterTable
ALTER TABLE "SkillTaxonomyMapping" ADD COLUMN     "taxonomy_group_node_id" UUID,
ADD COLUMN     "taxonomy_subgroup_node_id" UUID;

-- CreateTable
CREATE TABLE "SkillTaxonomyNode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "normalized_key" VARCHAR(220) NOT NULL,
    "parent_id" UUID,
    "level" INTEGER NOT NULL,
    "node_type" "SkillTaxonomyNodeType" NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillTaxonomyNode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillTaxonomyNode_parent_id_idx" ON "SkillTaxonomyNode"("parent_id");

-- CreateIndex
CREATE INDEX "SkillTaxonomyNode_level_idx" ON "SkillTaxonomyNode"("level");

-- CreateIndex
CREATE INDEX "SkillTaxonomyNode_node_type_idx" ON "SkillTaxonomyNode"("node_type");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTaxonomyNode_parent_id_normalized_key_key" ON "SkillTaxonomyNode"("parent_id", "normalized_key");

-- CreateIndex
CREATE INDEX "SkillTaxonomyMapping_taxonomy_group_node_id_idx" ON "SkillTaxonomyMapping"("taxonomy_group_node_id");

-- CreateIndex
CREATE INDEX "SkillTaxonomyMapping_taxonomy_subgroup_node_id_idx" ON "SkillTaxonomyMapping"("taxonomy_subgroup_node_id");

-- AddForeignKey
ALTER TABLE "SkillTaxonomyMapping" ADD CONSTRAINT "SkillTaxonomyMapping_taxonomy_group_node_id_fkey" FOREIGN KEY ("taxonomy_group_node_id") REFERENCES "SkillTaxonomyNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTaxonomyMapping" ADD CONSTRAINT "SkillTaxonomyMapping_taxonomy_subgroup_node_id_fkey" FOREIGN KEY ("taxonomy_subgroup_node_id") REFERENCES "SkillTaxonomyNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTaxonomyNode" ADD CONSTRAINT "SkillTaxonomyNode_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "SkillTaxonomyNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
