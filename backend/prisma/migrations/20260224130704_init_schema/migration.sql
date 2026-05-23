-- CreateEnum
CREATE TYPE "GenderEmployee" AS ENUM ('Male', 'Femail');

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_code" VARCHAR(50),
    "name_role" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "emp_code" VARCHAR(50),
    "employee_name" VARCHAR(300),
    "password" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE,
    "gender" "GenderEmployee",
    "address" TEXT,
    "email" VARCHAR(100),
    "work_unit" TEXT,
    "position" TEXT,
    "job_title" VARCHAR(50),
    "director_id" UUID,
    "status" VARCHAR(50) NOT NULL,
    "first_day_of_work" DATE,
    "official_date" DATE,
    "phone_unit" VARCHAR(15),
    "email_unit" VARCHAR(100),
    "email_account" VARCHAR(100) NOT NULL,
    "phone_account" VARCHAR(15) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeRole" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_role" UUID NOT NULL,
    "id_employee" UUID NOT NULL,

    CONSTRAINT "EmployeeRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InforCompany" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "infor_code" VARCHAR(50),
    "full_name" VARCHAR(255),
    "acronym_name" VARCHAR(50),
    "business_type" VARCHAR(100),
    "tax_idennumber" VARCHAR(13),
    "code_company" VARCHAR(10),
    "date_stablish" DATE,
    "image_logo" TEXT,
    "code_business" VARCHAR(50),
    "date_of_issue" DATE,
    "place_of_issue" TEXT,
    "unit_title" VARCHAR(255),
    "address" TEXT,
    "phone_number" VARCHAR(15),
    "fax" VARCHAR(255),
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "status" VARCHAR(100),
    "parent_id" UUID,
    "organization_level" VARCHAR(255),
    "number_arrange" INTEGER,
    "field_of_activity" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InforCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionCompany" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "position_code" VARCHAR(50),
    "name_position" VARCHAR(100),
    "description" TEXT,
    "org_unit_id" UUID,
    "status" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "group_position" UUID,
    "job_title_id" UUID,

    CONSTRAINT "PositionCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTitle" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jt_code" VARCHAR(50),
    "name_title" VARCHAR(100),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPosition" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gp_code" VARCHAR(50),
    "name_group" VARCHAR(100),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recruitment_Infor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recruitment_code" VARCHAR(50),
    "internal_title" VARCHAR(300),
    "post_title" VARCHAR(300),
    "department_id" UUID,
    "rank_id" UUID,
    "work_location_id" UUID,
    "type_of_job" VARCHAR(150),
    "application_deadline" DATE,
    "salary_from" DOUBLE PRECISION,
    "salary_to" DOUBLE PRECISION,
    "salary_currency" VARCHAR(50),
    "contact_person_id" UUID,
    "status" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recruitment_Infor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recruitment_Plan_Parent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recruitment_id" UUID,
    "total_real_number" INTEGER,
    "monthly_target" DATE,
    "expected_deadline" DATE,

    CONSTRAINT "Recruitment_Plan_Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recruitment_Plan_Child_Batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recruitment_plan_parent_id" UUID,
    "batches_title" VARCHAR(200),
    "from_date" DATE,
    "to_date" DATE,
    "number_recruitment" INTEGER,
    "monthly_target" DATE,

    CONSTRAINT "Recruitment_Plan_Child_Batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recruitment_Plan_Child_Posted" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recruitment_plan_parent_id" UUID,
    "posted_date" DATE,
    "expiration_date" DATE,
    "job_board" VARCHAR(100),

    CONSTRAINT "Recruitment_Plan_Child_Posted_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recruitment_Costs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recruitment_id" UUID,
    "cost_type" VARCHAR(300),
    "amount" DOUBLE PRECISION,
    "currency" VARCHAR(50),

    CONSTRAINT "Recruitment_Costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recruitment_Cost_Channel" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recruitment_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "expected_cost" DOUBLE PRECISION,
    "note" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recruitment_Cost_Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting_Position_Posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "position_code" VARCHAR(50),
    "name_post" VARCHAR(100),
    "unit_id" UUID,
    "description_post" TEXT,
    "requirements_post" TEXT,
    "benefits_post" TEXT,
    "Setting_Process_Recruitment_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "auto_rotation" BOOLEAN NOT NULL DEFAULT false,
    "auto_eli_candidate" BOOLEAN NOT NULL DEFAULT false,
    "auto_near" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(50),

    CONSTRAINT "Setting_Position_Posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting_Process_Recruitment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "process_code" VARCHAR(50),
    "name_process" VARCHAR(100),
    "order_index" INTEGER NOT NULL,
    "hex_color" VARCHAR(7),
    "is_started" BOOLEAN NOT NULL DEFAULT false,
    "is_ended" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setting_Process_Recruitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rank" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rank_code" VARCHAR(50),
    "name_rank" VARCHAR(100),
    "unit_id" UUID,
    "status" VARCHAR(50),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting_Training_Level" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "level_code" VARCHAR(50),
    "name_level" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setting_Training_Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting_Potential_Type" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Setting_Potential_Type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupReason_DisCandidate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_reason_code" VARCHAR(50),
    "name_group_reason" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupReason_DisCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reason_DisCandidate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reason_code" VARCHAR(50),
    "name_reason" VARCHAR(100),
    "group_reason_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reason_DisCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting_Email_Other" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sec_code" VARCHAR(50),
    "email_name" VARCHAR(300),
    "unit_id" UUID,
    "email_subject" VARCHAR(255),
    "email_body" TEXT,
    "auto_send" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setting_Email_Other_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting_Evaluation_Template" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sec_code" VARCHAR(50),
    "template_name" VARCHAR(200),
    "unit_id" UUID,
    "position_applied_id" UUID NOT NULL,
    "interview_script" TEXT,
    "criteria_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setting_Evaluation_Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting_Evaluation_Criterias" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evaluation_template_id" UUID NOT NULL,
    "criteria_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "Setting_Evaluation_Criterias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting_Evaluation_Criteria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sec_code" VARCHAR(50),
    "criteria_name" VARCHAR(200),
    "guide_crite" TEXT,
    "type_criteria" VARCHAR(100),
    "request_pass_fail" BOOLEAN NOT NULL DEFAULT false,
    "include_in_conclusion" BOOLEAN NOT NULL DEFAULT false,
    "weight" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setting_Evaluation_Criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting_JobEmailOffer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sec_code" VARCHAR(50),
    "offer_name" VARCHAR(200),
    "unit_id" UUID,
    "offer_subject" VARCHAR(255),
    "offer_body" TEXT,
    "letter_template" TEXT,
    "file_letter_template" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setting_JobEmailOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_code" VARCHAR(50),
    "candidate_name" VARCHAR(300),
    "date_of_birth" DATE,
    "gender" VARCHAR(50),
    "phone_number" VARCHAR(15),
    "email" VARCHAR(100),
    "address" TEXT,
    "country" VARCHAR(100),
    "provice" VARCHAR(100),
    "district" VARCHAR(100),
    "date_applied" DATE,
    "source_channel_id" UUID,
    "position_applied_id" UUID,
    "referrer_id" UUID,
    "process_id" UUID,
    "recruitment_infor_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_potential" BOOLEAN NOT NULL DEFAULT false,
    "potential_type_id" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate_Experience" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "company_name" VARCHAR(200),
    "position" VARCHAR(100),
    "from_month" DATE,
    "to_month" DATE,
    "job_description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Candidate_Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedules_Type" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "st_code" VARCHAR(50),
    "type_name" VARCHAR(100),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Schedules_Type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeSchedules_Link" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tl_code" VARCHAR(50),
    "type_schedule_id" UUID NOT NULL,
    "exam_link" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TypeSchedules_Link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview_Schedule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sche_code" VARCHAR(50),
    "interview_date" TIMESTAMP(6),
    "interview_location" TEXT,
    "interview_room" VARCHAR(100),
    "time_duration" INTEGER NOT NULL,
    "times" TIMESTAMP(6),
    "type_schedule_id" UUID,
    "evaluation_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule_Interviewers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "interview_schedule_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,

    CONSTRAINT "Schedule_Interviewers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedules_Candidates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "interview_schedule_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,

    CONSTRAINT "Schedules_Candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_code" VARCHAR(50),
    "name_job" VARCHAR(200),
    "description_job" TEXT,
    "type_job" VARCHAR(100),
    "result_job" VARCHAR(100),
    "employee_id" UUID,
    "deadline" DATE,
    "remind_enabled" BOOLEAN DEFAULT false,
    "remind_before_minutes" INTEGER,
    "status" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job_Candidates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,

    CONSTRAINT "Job_Candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionSkill" (
    "position_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "level" INTEGER,
    "is_required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PositionSkill_pkey" PRIMARY KEY ("position_id","skill_id")
);

-- CreateTable
CREATE TABLE "CandidateSkill" (
    "candidate_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "level" INTEGER,

    CONSTRAINT "CandidateSkill_pkey" PRIMARY KEY ("candidate_id","skill_id")
);

-- CreateTable
CREATE TABLE "CompanyRegistrationRequest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "createdById" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "inforCompanyId" UUID,

    CONSTRAINT "CompanyRegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_role_code_key" ON "Role"("role_code");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_emp_code_key" ON "Employee"("emp_code");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_account_key" ON "Employee"("email_account");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_phone_account_key" ON "Employee"("phone_account");

-- CreateIndex
CREATE INDEX "EmployeeRole_id_role_idx" ON "EmployeeRole"("id_role");

-- CreateIndex
CREATE INDEX "EmployeeRole_id_employee_idx" ON "EmployeeRole"("id_employee");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeRole_id_role_id_employee_key" ON "EmployeeRole"("id_role", "id_employee");

-- CreateIndex
CREATE UNIQUE INDEX "InforCompany_infor_code_key" ON "InforCompany"("infor_code");

-- CreateIndex
CREATE INDEX "InforCompany_parent_id_idx" ON "InforCompany"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "PositionCompany_position_code_key" ON "PositionCompany"("position_code");

-- CreateIndex
CREATE UNIQUE INDEX "JobTitle_jt_code_key" ON "JobTitle"("jt_code");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPosition_gp_code_key" ON "GroupPosition"("gp_code");

-- CreateIndex
CREATE UNIQUE INDEX "Recruitment_Infor_recruitment_code_key" ON "Recruitment_Infor"("recruitment_code");

-- CreateIndex
CREATE UNIQUE INDEX "Recruitment_Plan_Child_Batches_batches_title_key" ON "Recruitment_Plan_Child_Batches"("batches_title");

-- CreateIndex
CREATE INDEX "Recruitment_Cost_Channel_recruitment_id_idx" ON "Recruitment_Cost_Channel"("recruitment_id");

-- CreateIndex
CREATE UNIQUE INDEX "Recruitment_Cost_Channel_recruitment_id_channel_id_key" ON "Recruitment_Cost_Channel"("recruitment_id", "channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_Position_Posts_position_code_key" ON "Setting_Position_Posts"("position_code");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_Process_Recruitment_process_code_key" ON "Setting_Process_Recruitment"("process_code");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_Process_Recruitment_name_process_key" ON "Setting_Process_Recruitment"("name_process");

-- CreateIndex
CREATE UNIQUE INDEX "Rank_rank_code_key" ON "Rank"("rank_code");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_Training_Level_level_code_key" ON "Setting_Training_Level"("level_code");

-- CreateIndex
CREATE UNIQUE INDEX "GroupReason_DisCandidate_group_reason_code_key" ON "GroupReason_DisCandidate"("group_reason_code");

-- CreateIndex
CREATE UNIQUE INDEX "Reason_DisCandidate_reason_code_key" ON "Reason_DisCandidate"("reason_code");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_Email_Other_sec_code_key" ON "Setting_Email_Other"("sec_code");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_Evaluation_Template_sec_code_key" ON "Setting_Evaluation_Template"("sec_code");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_Evaluation_Criteria_sec_code_key" ON "Setting_Evaluation_Criteria"("sec_code");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_JobEmailOffer_sec_code_key" ON "Setting_JobEmailOffer"("sec_code");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_candidate_code_key" ON "Candidate"("candidate_code");

-- CreateIndex
CREATE UNIQUE INDEX "Schedules_Type_st_code_key" ON "Schedules_Type"("st_code");

-- CreateIndex
CREATE UNIQUE INDEX "TypeSchedules_Link_tl_code_key" ON "TypeSchedules_Link"("tl_code");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_Schedule_sche_code_key" ON "Interview_Schedule"("sche_code");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_Interviewers_interview_schedule_id_employee_id_key" ON "Schedule_Interviewers"("interview_schedule_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "Schedules_Candidates_interview_schedule_id_candidate_id_key" ON "Schedules_Candidates"("interview_schedule_id", "candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "Job_job_code_key" ON "Job"("job_code");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_parent_id_key" ON "Skill"("name", "parent_id");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_director_id_fkey" FOREIGN KEY ("director_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeRole" ADD CONSTRAINT "EmployeeRole_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeRole" ADD CONSTRAINT "EmployeeRole_id_employee_fkey" FOREIGN KEY ("id_employee") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InforCompany" ADD CONSTRAINT "InforCompany_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "InforCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionCompany" ADD CONSTRAINT "PositionCompany_org_unit_id_fkey" FOREIGN KEY ("org_unit_id") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruitment_Infor" ADD CONSTRAINT "Recruitment_Infor_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruitment_Infor" ADD CONSTRAINT "Recruitment_Infor_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "Rank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruitment_Infor" ADD CONSTRAINT "Recruitment_Infor_work_location_id_fkey" FOREIGN KEY ("work_location_id") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruitment_Infor" ADD CONSTRAINT "Recruitment_Infor_contact_person_id_fkey" FOREIGN KEY ("contact_person_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruitment_Plan_Parent" ADD CONSTRAINT "Recruitment_Plan_Parent_recruitment_id_fkey" FOREIGN KEY ("recruitment_id") REFERENCES "Recruitment_Infor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruitment_Plan_Child_Batches" ADD CONSTRAINT "Recruitment_Plan_Child_Batches_recruitment_plan_parent_id_fkey" FOREIGN KEY ("recruitment_plan_parent_id") REFERENCES "Recruitment_Plan_Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruitment_Plan_Child_Posted" ADD CONSTRAINT "Recruitment_Plan_Child_Posted_recruitment_plan_parent_id_fkey" FOREIGN KEY ("recruitment_plan_parent_id") REFERENCES "Recruitment_Plan_Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruitment_Costs" ADD CONSTRAINT "Recruitment_Costs_recruitment_id_fkey" FOREIGN KEY ("recruitment_id") REFERENCES "Recruitment_Infor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruitment_Cost_Channel" ADD CONSTRAINT "Recruitment_Cost_Channel_recruitment_id_fkey" FOREIGN KEY ("recruitment_id") REFERENCES "Recruitment_Infor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting_Position_Posts" ADD CONSTRAINT "Setting_Position_Posts_Setting_Process_Recruitment_id_fkey" FOREIGN KEY ("Setting_Process_Recruitment_id") REFERENCES "Setting_Process_Recruitment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting_Position_Posts" ADD CONSTRAINT "Setting_Position_Posts_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank" ADD CONSTRAINT "Rank_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reason_DisCandidate" ADD CONSTRAINT "Reason_DisCandidate_group_reason_id_fkey" FOREIGN KEY ("group_reason_id") REFERENCES "GroupReason_DisCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting_Email_Other" ADD CONSTRAINT "Setting_Email_Other_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting_Evaluation_Template" ADD CONSTRAINT "Setting_Evaluation_Template_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "Setting_Evaluation_Criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting_Evaluation_Template" ADD CONSTRAINT "Setting_Evaluation_Template_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting_Evaluation_Template" ADD CONSTRAINT "Setting_Evaluation_Template_position_applied_id_fkey" FOREIGN KEY ("position_applied_id") REFERENCES "Setting_Position_Posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting_Evaluation_Criterias" ADD CONSTRAINT "Setting_Evaluation_Criterias_evaluation_template_id_fkey" FOREIGN KEY ("evaluation_template_id") REFERENCES "Setting_Evaluation_Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting_Evaluation_Criterias" ADD CONSTRAINT "Setting_Evaluation_Criterias_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "Setting_Evaluation_Criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting_JobEmailOffer" ADD CONSTRAINT "Setting_JobEmailOffer_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_recruitment_infor_id_fkey" FOREIGN KEY ("recruitment_infor_id") REFERENCES "Recruitment_Infor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_position_applied_id_fkey" FOREIGN KEY ("position_applied_id") REFERENCES "Setting_Position_Posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "Setting_Process_Recruitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_potential_type_id_fkey" FOREIGN KEY ("potential_type_id") REFERENCES "Setting_Potential_Type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate_Experience" ADD CONSTRAINT "Candidate_Experience_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeSchedules_Link" ADD CONSTRAINT "TypeSchedules_Link_type_schedule_id_fkey" FOREIGN KEY ("type_schedule_id") REFERENCES "Schedules_Type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview_Schedule" ADD CONSTRAINT "Interview_Schedule_type_schedule_id_fkey" FOREIGN KEY ("type_schedule_id") REFERENCES "Schedules_Type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview_Schedule" ADD CONSTRAINT "Interview_Schedule_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "Setting_Evaluation_Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule_Interviewers" ADD CONSTRAINT "Schedule_Interviewers_interview_schedule_id_fkey" FOREIGN KEY ("interview_schedule_id") REFERENCES "Interview_Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule_Interviewers" ADD CONSTRAINT "Schedule_Interviewers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedules_Candidates" ADD CONSTRAINT "Schedules_Candidates_interview_schedule_id_fkey" FOREIGN KEY ("interview_schedule_id") REFERENCES "Interview_Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedules_Candidates" ADD CONSTRAINT "Schedules_Candidates_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job_Candidates" ADD CONSTRAINT "Job_Candidates_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job_Candidates" ADD CONSTRAINT "Job_Candidates_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionSkill" ADD CONSTRAINT "PositionSkill_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Setting_Position_Posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionSkill" ADD CONSTRAINT "PositionSkill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRegistrationRequest" ADD CONSTRAINT "CompanyRegistrationRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRegistrationRequest" ADD CONSTRAINT "CompanyRegistrationRequest_inforCompanyId_fkey" FOREIGN KEY ("inforCompanyId") REFERENCES "InforCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
