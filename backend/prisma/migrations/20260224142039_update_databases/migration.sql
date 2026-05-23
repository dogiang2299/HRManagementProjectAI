/*
  Warnings:

  - You are about to drop the `GroupPosition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupReason_DisCandidate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobTitle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PositionCompany` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reason_DisCandidate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Setting_Email_Other` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Setting_Evaluation_Criteria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Setting_Evaluation_Criterias` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Setting_Evaluation_Template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Setting_JobEmailOffer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Setting_Process_Recruitment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_process_id_fkey";

-- DropForeignKey
ALTER TABLE "Interview_Schedule" DROP CONSTRAINT "Interview_Schedule_evaluation_id_fkey";

-- DropForeignKey
ALTER TABLE "PositionCompany" DROP CONSTRAINT "PositionCompany_org_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "Reason_DisCandidate" DROP CONSTRAINT "Reason_DisCandidate_group_reason_id_fkey";

-- DropForeignKey
ALTER TABLE "Setting_Email_Other" DROP CONSTRAINT "Setting_Email_Other_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "Setting_Evaluation_Criterias" DROP CONSTRAINT "Setting_Evaluation_Criterias_criteria_id_fkey";

-- DropForeignKey
ALTER TABLE "Setting_Evaluation_Criterias" DROP CONSTRAINT "Setting_Evaluation_Criterias_evaluation_template_id_fkey";

-- DropForeignKey
ALTER TABLE "Setting_Evaluation_Template" DROP CONSTRAINT "Setting_Evaluation_Template_criteria_id_fkey";

-- DropForeignKey
ALTER TABLE "Setting_Evaluation_Template" DROP CONSTRAINT "Setting_Evaluation_Template_position_applied_id_fkey";

-- DropForeignKey
ALTER TABLE "Setting_Evaluation_Template" DROP CONSTRAINT "Setting_Evaluation_Template_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "Setting_JobEmailOffer" DROP CONSTRAINT "Setting_JobEmailOffer_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "Setting_Position_Posts" DROP CONSTRAINT "Setting_Position_Posts_Setting_Process_Recruitment_id_fkey";

-- DropTable
DROP TABLE "GroupPosition";

-- DropTable
DROP TABLE "GroupReason_DisCandidate";

-- DropTable
DROP TABLE "JobTitle";

-- DropTable
DROP TABLE "PositionCompany";

-- DropTable
DROP TABLE "Reason_DisCandidate";

-- DropTable
DROP TABLE "Setting_Email_Other";

-- DropTable
DROP TABLE "Setting_Evaluation_Criteria";

-- DropTable
DROP TABLE "Setting_Evaluation_Criterias";

-- DropTable
DROP TABLE "Setting_Evaluation_Template";

-- DropTable
DROP TABLE "Setting_JobEmailOffer";

-- DropTable
DROP TABLE "Setting_Process_Recruitment";

-- CreateTable
CREATE TABLE "SettingEmail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sec_code" VARCHAR(50),
    "email_type" VARCHAR(50) NOT NULL,
    "name" VARCHAR(300),
    "unit_id" UUID,
    "subject" VARCHAR(255),
    "body" TEXT,
    "auto_send" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettingEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SettingEmail_sec_code_key" ON "SettingEmail"("sec_code");

-- AddForeignKey
ALTER TABLE "SettingEmail" ADD CONSTRAINT "SettingEmail_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
