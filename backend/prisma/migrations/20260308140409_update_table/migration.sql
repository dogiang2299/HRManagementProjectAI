/*
  Warnings:

  - You are about to drop the column `evaluation_id` on the `Interview_Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `type_schedule_id` on the `Interview_Schedule` table. All the data in the column will be lost.
  - You are about to drop the `Schedules_Type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TypeSchedules_Link` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Interview_Schedule" DROP CONSTRAINT "Interview_Schedule_type_schedule_id_fkey";

-- DropForeignKey
ALTER TABLE "TypeSchedules_Link" DROP CONSTRAINT "TypeSchedules_Link_type_schedule_id_fkey";

-- AlterTable
ALTER TABLE "Interview_Schedule" DROP COLUMN "evaluation_id",
DROP COLUMN "type_schedule_id",
ADD COLUMN     "type_schedule" UUID;

-- DropTable
DROP TABLE "Schedules_Type";

-- DropTable
DROP TABLE "TypeSchedules_Link";
