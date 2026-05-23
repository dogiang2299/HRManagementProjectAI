-- AlterTable
ALTER TABLE "Setting_Position_Posts" ADD COLUMN     "group_id" UUID;

-- CreateTable
CREATE TABLE "Position_Group" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name_group" VARCHAR(150) NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_Group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Position_Group_slug_key" ON "Position_Group"("slug");

-- AddForeignKey
ALTER TABLE "Setting_Position_Posts" ADD CONSTRAINT "Setting_Position_Posts_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Position_Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
