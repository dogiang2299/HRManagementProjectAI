-- CreateTable
CREATE TABLE "company_follow" (
    "candidate_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_follow_pkey" PRIMARY KEY ("candidate_id","company_id")
);

-- CreateIndex
CREATE INDEX "company_follow_candidate_id_idx" ON "company_follow"("candidate_id");

-- CreateIndex
CREATE INDEX "company_follow_company_id_idx" ON "company_follow"("company_id");

-- AddForeignKey
ALTER TABLE "company_follow" ADD CONSTRAINT "company_follow_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_follow" ADD CONSTRAINT "company_follow_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
