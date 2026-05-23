-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "company_id" UUID;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "InforCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
