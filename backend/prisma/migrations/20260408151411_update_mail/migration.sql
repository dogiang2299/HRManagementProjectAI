/*
  Warnings:

  - You are about to drop the column `is_deleted` on the `InforCompany` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InforCompany" DROP COLUMN "is_deleted";

-- AlterTable
ALTER TABLE "SettingEmail" ADD COLUMN     "template_type" VARCHAR(50);

-- CreateTable
CREATE TABLE "PasswordResetOtp" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "otp_code" VARCHAR(10) NOT NULL,
    "expired_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID,
    "to_email" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255),
    "body" TEXT,
    "status" VARCHAR(50),
    "error_message" TEXT,
    "sent_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);
