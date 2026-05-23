-- CreateEnum
CREATE TYPE "InterviewScheduleStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Interview_Schedule" ADD COLUMN     "accepted_at" TIMESTAMP(6),
ADD COLUMN     "cancelled_at" TIMESTAMP(6),
ADD COLUMN     "expired_at" TIMESTAMP(6),
ADD COLUMN     "rejected_at" TIMESTAMP(6),
ADD COLUMN     "status" "InterviewScheduleStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "category" TEXT NOT NULL DEFAULT 'IT Career',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "author_name" TEXT DEFAULT 'ITJob Team',
    "read_time" INTEGER DEFAULT 5,
    "is_published" BOOLEAN DEFAULT true,
    "published_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
