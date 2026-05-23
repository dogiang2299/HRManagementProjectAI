-- AlterTable
ALTER TABLE "PasswordResetOtp" ADD COLUMN     "employee_id" UUID,
ALTER COLUMN "expired_at" SET DATA TYPE TIMESTAMP(6);

-- CreateIndex
CREATE INDEX "PasswordResetOtp_email_idx" ON "PasswordResetOtp"("email");

-- CreateIndex
CREATE INDEX "PasswordResetOtp_employee_id_idx" ON "PasswordResetOtp"("employee_id");

-- AddForeignKey
ALTER TABLE "PasswordResetOtp" ADD CONSTRAINT "PasswordResetOtp_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
