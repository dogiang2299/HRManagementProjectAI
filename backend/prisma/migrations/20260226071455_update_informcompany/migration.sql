/*
  Warnings:

  - You are about to drop the column `number_arrange` on the `InforCompany` table. All the data in the column will be lost.
  - You are about to drop the column `organization_level` on the `InforCompany` table. All the data in the column will be lost.
  - You are about to drop the column `parent_id` on the `InforCompany` table. All the data in the column will be lost.
  - You are about to drop the column `unit_title` on the `InforCompany` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "InforCompany" DROP CONSTRAINT "InforCompany_parent_id_fkey";

-- DropIndex
DROP INDEX "InforCompany_parent_id_idx";

-- AlterTable
ALTER TABLE "InforCompany" DROP COLUMN "number_arrange",
DROP COLUMN "organization_level",
DROP COLUMN "parent_id",
DROP COLUMN "unit_title";
