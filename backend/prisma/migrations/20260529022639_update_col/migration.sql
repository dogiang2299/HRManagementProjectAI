-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "current_address" VARCHAR(255),
ADD COLUMN     "current_country" VARCHAR(100),
ADD COLUMN     "current_district" VARCHAR(100),
ADD COLUMN     "current_province" VARCHAR(100);
