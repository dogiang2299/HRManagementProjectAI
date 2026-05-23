-- CreateTable
CREATE TABLE "SavedJRecruitment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "recruitment_infor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedJRecruitment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedJRecruitment_candidate_id_recruitment_infor_id_key" ON "SavedJRecruitment"("candidate_id", "recruitment_infor_id");

-- AddForeignKey
ALTER TABLE "SavedJRecruitment" ADD CONSTRAINT "SavedJRecruitment_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJRecruitment" ADD CONSTRAINT "SavedJRecruitment_recruitment_infor_id_fkey" FOREIGN KEY ("recruitment_infor_id") REFERENCES "Recruitment_Infor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
