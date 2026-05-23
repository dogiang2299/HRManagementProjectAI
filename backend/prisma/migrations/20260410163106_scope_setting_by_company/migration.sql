-- AlterTable
ALTER TABLE "Position_Group" ADD COLUMN     "unit_id" UUID;

-- AlterTable
ALTER TABLE "Setting_Potential_Type" ADD COLUMN     "unit_id" UUID;

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "unit_id" UUID;

-- AddForeignKey
ALTER TABLE "Position_Group" ADD CONSTRAINT "Position_Group_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting_Potential_Type" ADD CONSTRAINT "Setting_Potential_Type_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
