-- AlterTable
ALTER TABLE "InforCompany" ADD COLUMN     "field_of_activity_id" UUID;

-- AddForeignKey
ALTER TABLE "InforCompany" ADD CONSTRAINT "InforCompany_field_of_activity_id_fkey" FOREIGN KEY ("field_of_activity_id") REFERENCES "Position_Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
