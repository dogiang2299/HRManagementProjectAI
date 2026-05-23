-- CreateTable
CREATE TABLE "candidate_cv" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "title" VARCHAR(255),
    "source_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "file_url" TEXT,
    "file_name" VARCHAR(500),
    "raw_text" TEXT,
    "structured_data" JSONB,
    "summary" TEXT,
    "desired_position" VARCHAR(255),
    "years_experience" DOUBLE PRECISION,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "candidate_cv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_cv_chat_message" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cv_id" UUID NOT NULL,
    "role" VARCHAR(30) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_cv_chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candidate_cv_candidate_id_idx" ON "candidate_cv"("candidate_id");

-- CreateIndex
CREATE INDEX "candidate_cv_source_type_idx" ON "candidate_cv"("source_type");

-- CreateIndex
CREATE INDEX "candidate_cv_status_idx" ON "candidate_cv"("status");

-- CreateIndex
CREATE INDEX "candidate_cv_is_primary_idx" ON "candidate_cv"("is_primary");

-- CreateIndex
CREATE INDEX "candidate_cv_chat_message_cv_id_idx" ON "candidate_cv_chat_message"("cv_id");

-- AddForeignKey
ALTER TABLE "candidate_cv" ADD CONSTRAINT "candidate_cv_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_cv_chat_message" ADD CONSTRAINT "candidate_cv_chat_message_cv_id_fkey" FOREIGN KEY ("cv_id") REFERENCES "candidate_cv"("id") ON DELETE CASCADE ON UPDATE CASCADE;
