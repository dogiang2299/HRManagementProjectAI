-- Add cover letter field for candidate apply modal
ALTER TABLE "Application"
ADD COLUMN IF NOT EXISTS "cover_letter" TEXT;
