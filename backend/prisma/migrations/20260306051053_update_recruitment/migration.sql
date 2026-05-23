/*
  Warnings:

  - You are about to drop the column `position_applied_id` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `recruitment_infor_id` on the `Candidate` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_position_applied_id_fkey";

-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_recruitment_infor_id_fkey";

-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "position_applied_id",
DROP COLUMN "recruitment_infor_id";
