-- CreateTable
CREATE TABLE "ai_cv_chat_session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "title" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL,
    "draft_context" JSONB NOT NULL,
    "exported_cv_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "ai_cv_chat_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_cv_chat_message" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "role" VARCHAR(30) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_cv_chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_cv_chat_session_candidate_id_idx" ON "ai_cv_chat_session"("candidate_id");

-- CreateIndex
CREATE INDEX "ai_cv_chat_session_status_idx" ON "ai_cv_chat_session"("status");

-- CreateIndex
CREATE INDEX "ai_cv_chat_session_exported_cv_id_idx" ON "ai_cv_chat_session"("exported_cv_id");

-- CreateIndex
CREATE INDEX "ai_cv_chat_message_session_id_idx" ON "ai_cv_chat_message"("session_id");

-- AddForeignKey
ALTER TABLE "ai_cv_chat_session" ADD CONSTRAINT "ai_cv_chat_session_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_cv_chat_session" ADD CONSTRAINT "ai_cv_chat_session_exported_cv_id_fkey" FOREIGN KEY ("exported_cv_id") REFERENCES "candidate_cv"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_cv_chat_message" ADD CONSTRAINT "ai_cv_chat_message_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ai_cv_chat_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
