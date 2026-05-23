-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "employee_id" UUID;

-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "recruitment_infor_id" UUID NOT NULL,
    "company_id" UUID,
    "last_message" TEXT,
    "last_message_at" TIMESTAMP(3),
    "candidate_unread_count" INTEGER NOT NULL DEFAULT 0,
    "employer_unread_count" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "sender_type" VARCHAR(30) NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" VARCHAR(30) NOT NULL DEFAULT 'TEXT',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "receiver_id" UUID NOT NULL,
    "receiver_role" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "related_type" VARCHAR(50),
    "related_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatConversation_application_id_key" ON "ChatConversation"("application_id");

-- CreateIndex
CREATE INDEX "ChatConversation_candidate_id_idx" ON "ChatConversation"("candidate_id");

-- CreateIndex
CREATE INDEX "ChatConversation_employer_id_idx" ON "ChatConversation"("employer_id");

-- CreateIndex
CREATE INDEX "ChatConversation_recruitment_infor_id_idx" ON "ChatConversation"("recruitment_infor_id");

-- CreateIndex
CREATE INDEX "ChatConversation_company_id_idx" ON "ChatConversation"("company_id");

-- CreateIndex
CREATE INDEX "ChatConversation_last_message_at_idx" ON "ChatConversation"("last_message_at");

-- CreateIndex
CREATE INDEX "ChatMessage_conversation_id_created_at_idx" ON "ChatMessage"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "ChatMessage_sender_type_sender_id_idx" ON "ChatMessage"("sender_type", "sender_id");

-- CreateIndex
CREATE INDEX "Notification_receiver_id_receiver_role_idx" ON "Notification"("receiver_id", "receiver_role");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_is_read_idx" ON "Notification"("is_read");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_employee_id_key" ON "Candidate"("employee_id");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_recruitment_infor_id_fkey" FOREIGN KEY ("recruitment_infor_id") REFERENCES "Recruitment_Infor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "InforCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

