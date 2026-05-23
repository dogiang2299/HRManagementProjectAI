ALTER TABLE "Interview_Schedule"
ADD COLUMN IF NOT EXISTS "company_id" UUID;

UPDATE "Interview_Schedule" s
SET "company_id" = c."id"
FROM "InforCompany" c
WHERE s."company_id" IS NULL
  AND s."interview_location" IS NOT NULL
  AND (
    lower(trim(s."interview_location")) = lower(trim(c."full_name"))
    OR lower(trim(s."interview_location")) = lower(trim(c."acronym_name"))
  );

WITH inferred_company AS (
  SELECT DISTINCT ON (s."id")
    s."id" AS schedule_id,
    COALESCE(
      ri."department_id",
      ri."work_location_id",
      spp."unit_id",
      e."company_id"
    ) AS company_id
  FROM "Interview_Schedule" s
  JOIN "Schedules_Candidates" sc
    ON sc."interview_schedule_id" = s."id"
  JOIN "Application" a
    ON a."candidate_id" = sc."candidate_id"
  JOIN "Recruitment_Infor" ri
    ON ri."id" = a."recruitment_infor_id"
  LEFT JOIN "Setting_Position_Posts" spp
    ON spp."id" = ri."position_post_id"
  LEFT JOIN "Employee" e
    ON e."id" = ri."contact_person_id"
  WHERE s."company_id" IS NULL
  ORDER BY s."id", a."created_at" DESC
)
UPDATE "Interview_Schedule" s
SET "company_id" = inferred_company.company_id
FROM inferred_company
WHERE s."id" = inferred_company.schedule_id
  AND s."company_id" IS NULL
  AND inferred_company.company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Interview_Schedule_company_id_idx"
ON "Interview_Schedule"("company_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Interview_Schedule_company_id_fkey'
  ) THEN
    ALTER TABLE "Interview_Schedule"
    ADD CONSTRAINT "Interview_Schedule_company_id_fkey"
    FOREIGN KEY ("company_id")
    REFERENCES "InforCompany"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;
