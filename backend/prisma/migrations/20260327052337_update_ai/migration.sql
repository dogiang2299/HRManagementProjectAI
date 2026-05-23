/*
  Warnings:

  - The values [Femail] on the enum `GenderEmployee` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GenderEmployee_new" AS ENUM ('Male', 'Female');
ALTER TABLE "Employee" ALTER COLUMN "gender" TYPE "GenderEmployee_new" USING ("gender"::text::"GenderEmployee_new");
ALTER TYPE "GenderEmployee" RENAME TO "GenderEmployee_old";
ALTER TYPE "GenderEmployee_new" RENAME TO "GenderEmployee";
DROP TYPE "public"."GenderEmployee_old";
COMMIT;

-- DropIndex
DROP INDEX "Skill_name_parent_id_key";

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "career_summary" TEXT,
ADD COLUMN     "cv_extracted_text" TEXT,
ADD COLUMN     "desired_position_id" UUID,
ADD COLUMN     "desired_rank_id" UUID,
ADD COLUMN     "preferred_job_type" VARCHAR(100);

-- CreateTable
CREATE TABLE "SkillAlias" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "skill_id" UUID NOT NULL,
    "alias_text" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionAlias" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "position_id" UUID NOT NULL,
    "alias_text" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateAIProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "raw_text" TEXT,
    "normalized_text" TEXT,
    "detected_position_ids" UUID[],
    "detected_skill_ids" UUID[],
    "inferred_rank_id" UUID,
    "total_experience_months" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateAIProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobAIProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recruitment_infor_id" UUID NOT NULL,
    "raw_text" TEXT,
    "normalized_text" TEXT,
    "detected_position_ids" UUID[],
    "detected_skill_ids" UUID[],
    "rank_id" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobAIProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateEmbedding" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "model_name" VARCHAR(100) NOT NULL,
    "vector_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobEmbedding" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recruitment_infor_id" UUID NOT NULL,
    "model_name" VARCHAR(100) NOT NULL,
    "vector_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillAlias_alias_text_key" ON "SkillAlias"("alias_text");

-- CreateIndex
CREATE INDEX "PositionAlias_alias_text_idx" ON "PositionAlias"("alias_text");

-- CreateIndex
CREATE UNIQUE INDEX "PositionAlias_position_id_alias_text_key" ON "PositionAlias"("position_id", "alias_text");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateAIProfile_candidate_id_key" ON "CandidateAIProfile"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "JobAIProfile_recruitment_infor_id_key" ON "JobAIProfile"("recruitment_infor_id");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateEmbedding_candidate_id_key" ON "CandidateEmbedding"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "JobEmbedding_recruitment_infor_id_key" ON "JobEmbedding"("recruitment_infor_id");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_desired_position_id_fkey" FOREIGN KEY ("desired_position_id") REFERENCES "Setting_Position_Posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_desired_rank_id_fkey" FOREIGN KEY ("desired_rank_id") REFERENCES "Rank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillAlias" ADD CONSTRAINT "SkillAlias_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionAlias" ADD CONSTRAINT "PositionAlias_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Setting_Position_Posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateAIProfile" ADD CONSTRAINT "CandidateAIProfile_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateAIProfile" ADD CONSTRAINT "CandidateAIProfile_inferred_rank_id_fkey" FOREIGN KEY ("inferred_rank_id") REFERENCES "Rank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAIProfile" ADD CONSTRAINT "JobAIProfile_recruitment_infor_id_fkey" FOREIGN KEY ("recruitment_infor_id") REFERENCES "Recruitment_Infor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAIProfile" ADD CONSTRAINT "JobAIProfile_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "Rank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEmbedding" ADD CONSTRAINT "CandidateEmbedding_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEmbedding" ADD CONSTRAINT "JobEmbedding_recruitment_infor_id_fkey" FOREIGN KEY ("recruitment_infor_id") REFERENCES "Recruitment_Infor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
