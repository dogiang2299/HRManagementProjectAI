-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "applied_at" TIMESTAMP(3),
ADD COLUMN     "reapply_count" INTEGER NOT NULL DEFAULT 0;
