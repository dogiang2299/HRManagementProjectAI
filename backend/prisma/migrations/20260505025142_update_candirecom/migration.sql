-- CreateTable
CREATE TABLE "CandidateJobRecommendation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "recruitment_infor_id" UUID NOT NULL,
    "skill_overlap_score" DOUBLE PRECISION,
    "group_similarity_score" DOUBLE PRECISION,
    "dominant_group_score" DOUBLE PRECISION,
    "baseline_score" DOUBLE PRECISION,
    "semantic_score" DOUBLE PRECISION,
    "hybrid_score" DOUBLE PRECISION,
    "final_score" DOUBLE PRECISION NOT NULL,
    "matched_skill_ids" UUID[],
    "missing_skill_ids" UUID[],
    "reason_texts" TEXT[],
    "pipeline_version" VARCHAR(100),
    "model_name" VARCHAR(100),
    "calculated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateJobRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateJobRecommendation_candidate_id_final_score_idx" ON "CandidateJobRecommendation"("candidate_id", "final_score");

-- CreateIndex
CREATE INDEX "CandidateJobRecommendation_recruitment_infor_id_idx" ON "CandidateJobRecommendation"("recruitment_infor_id");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateJobRecommendation_candidate_id_recruitment_infor_i_key" ON "CandidateJobRecommendation"("candidate_id", "recruitment_infor_id");

-- AddForeignKey
ALTER TABLE "CandidateJobRecommendation" ADD CONSTRAINT "CandidateJobRecommendation_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateJobRecommendation" ADD CONSTRAINT "CandidateJobRecommendation_recruitment_infor_id_fkey" FOREIGN KEY ("recruitment_infor_id") REFERENCES "Recruitment_Infor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
