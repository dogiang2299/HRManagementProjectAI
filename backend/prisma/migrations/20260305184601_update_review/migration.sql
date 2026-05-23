-- CreateTable
CREATE TABLE "CandidateReview" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "rating" DECIMAL(2,1) NOT NULL,
    "comment" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateReview_candidate_id_idx" ON "CandidateReview"("candidate_id");

-- CreateIndex
CREATE INDEX "CandidateReview_reviewer_id_idx" ON "CandidateReview"("reviewer_id");

-- AddForeignKey
ALTER TABLE "CandidateReview" ADD CONSTRAINT "CandidateReview_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateReview" ADD CONSTRAINT "CandidateReview_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
