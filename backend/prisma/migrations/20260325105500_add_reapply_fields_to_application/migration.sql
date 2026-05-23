-- Add reapply tracking fields for candidate re-application flow
ALTER TABLE "Application"
ADD COLUMN IF NOT EXISTS "reapply_count" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Application"
ADD COLUMN IF NOT EXISTS "applied_at" TIMESTAMP(3);
