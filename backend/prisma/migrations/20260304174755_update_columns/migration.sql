/*
  Warnings:

  - You are about to drop the column `process_id` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `source_channel_id` on the `Candidate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "process_id",
DROP COLUMN "source_channel_id";
