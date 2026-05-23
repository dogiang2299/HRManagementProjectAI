-- CreateTable
CREATE TABLE "CandidateAuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "actor_employee_id" UUID,
    "actor_type" VARCHAR(30) NOT NULL DEFAULT 'System',
    "actor_role" VARCHAR(100),
    "action" VARCHAR(120) NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateAuditLog_candidate_id_created_at_idx" ON "CandidateAuditLog"("candidate_id", "created_at");

-- CreateIndex
CREATE INDEX "CandidateAuditLog_actor_employee_id_idx" ON "CandidateAuditLog"("actor_employee_id");

-- AddForeignKey
ALTER TABLE "CandidateAuditLog" ADD CONSTRAINT "CandidateAuditLog_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateAuditLog" ADD CONSTRAINT "CandidateAuditLog_actor_employee_id_fkey" FOREIGN KEY ("actor_employee_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
