-- AlterTable
ALTER TABLE "CandidateJobRecommendation" ADD COLUMN     "job_type_score" DOUBLE PRECISION,
ADD COLUMN     "location_score" DOUBLE PRECISION,
ADD COLUMN     "position_score" DOUBLE PRECISION,
ADD COLUMN     "rank_score" DOUBLE PRECISION;
