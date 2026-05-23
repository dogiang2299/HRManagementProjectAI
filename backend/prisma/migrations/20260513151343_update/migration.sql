-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "company_id" UUID;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "InforCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
