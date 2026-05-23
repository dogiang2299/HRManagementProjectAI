ALTER TABLE "Application"
ADD COLUMN "candidate_cv_id" UUID;

CREATE INDEX "Application_candidate_cv_id_idx"
ON "Application"("candidate_cv_id");

ALTER TABLE "Application"
ADD CONSTRAINT "Application_candidate_cv_id_fkey"
FOREIGN KEY ("candidate_cv_id") REFERENCES "candidate_cv"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
