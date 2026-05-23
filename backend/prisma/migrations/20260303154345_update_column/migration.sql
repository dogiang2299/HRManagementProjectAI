/*
  Warnings:

  - You are about to drop the `Recruitment_Cost_Channel` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `position_post_id` to the `Recruitment_Infor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Recruitment_Cost_Channel" DROP CONSTRAINT "Recruitment_Cost_Channel_recruitment_id_fkey";

-- AlterTable
ALTER TABLE "Recruitment_Infor" ADD COLUMN     "position_post_id" UUID NOT NULL;

-- DropTable
DROP TABLE "Recruitment_Cost_Channel";

-- AddForeignKey
ALTER TABLE "Recruitment_Infor" ADD CONSTRAINT "Recruitment_Infor_position_post_id_fkey" FOREIGN KEY ("position_post_id") REFERENCES "Setting_Position_Posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
