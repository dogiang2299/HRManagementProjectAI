-- CreateTable
CREATE TABLE "RecruitmentSkill" (
    "recruitment_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "level" INTEGER,
    "is_required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RecruitmentSkill_pkey" PRIMARY KEY ("recruitment_id","skill_id")
);

-- AddForeignKey
ALTER TABLE "RecruitmentSkill" ADD CONSTRAINT "RecruitmentSkill_recruitment_id_fkey" FOREIGN KEY ("recruitment_id") REFERENCES "Recruitment_Infor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentSkill" ADD CONSTRAINT "RecruitmentSkill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
