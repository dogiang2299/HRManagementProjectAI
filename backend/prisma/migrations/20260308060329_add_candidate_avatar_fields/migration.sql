/*
  Warnings:

  - You are about to drop the `Schedule_Interviewers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Schedule_Interviewers" DROP CONSTRAINT "Schedule_Interviewers_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "Schedule_Interviewers" DROP CONSTRAINT "Schedule_Interviewers_interview_schedule_id_fkey";

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "avatar_file" VARCHAR(500),
ADD COLUMN     "avatar_uploaded_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "Schedule_Interviewers";
