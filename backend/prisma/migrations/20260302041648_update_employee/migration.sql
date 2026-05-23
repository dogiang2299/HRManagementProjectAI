/*
  Warnings:

  - You are about to drop the column `director_id` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `email_unit` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `first_day_of_work` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `job_title` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `official_date` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `phone_unit` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `work_unit` on the `Employee` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_director_id_fkey";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "director_id",
DROP COLUMN "email_unit",
DROP COLUMN "first_day_of_work",
DROP COLUMN "job_title",
DROP COLUMN "official_date",
DROP COLUMN "phone_unit",
DROP COLUMN "position",
DROP COLUMN "work_unit";
