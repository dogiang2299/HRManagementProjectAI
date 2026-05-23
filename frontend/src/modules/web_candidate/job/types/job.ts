import type { RecruitmentStatusType } from "../../../../constant";

export const BUSSINESS_TYPE = {
  LLC_ONE_MEMBER: 'LLC_ONE_MEMBER',
  LLC_MULTI_MEMBER: 'LLC_MULTI_MEMBER',
  JOINT_STOCK: 'JOINT_STOCK',
  PRIVATE: 'PRIVATE',
  PARTNERSHIP: 'PARTNERSHIP',
  HOUSEHOLD: 'HOUSEHOLD',
  STATE: 'STATE',
  FDI: 'FDI',
} as const;

export const BUSINESS_TYPE_OPTIONS = [
  { value: BUSSINESS_TYPE.LLC_ONE_MEMBER, label: 'One member LLC' },
  { value: BUSSINESS_TYPE.LLC_MULTI_MEMBER, label: 'LLC with 2 or more members' },
  { value: BUSSINESS_TYPE.JOINT_STOCK, label: 'Joint Stock Company' },
  { value: BUSSINESS_TYPE.PRIVATE, label: 'Private enterprise' },
  { value: BUSSINESS_TYPE.PARTNERSHIP, label: 'Partnership company' },
  { value: BUSSINESS_TYPE.HOUSEHOLD, label: 'Business household' },
  { value: BUSSINESS_TYPE.STATE, label: 'State-owned enterprise' },
  { value: BUSSINESS_TYPE.FDI, label: 'Enterprises with foreign investment capital' },
];

export interface IInforCompany {
  id: string;

  infor_code?: string | null;
  full_name?: string | null;
  acronym_name?: string | null;
  business_type?: string | BussinessType;
  tax_idennumber?: string | null;
  code_company?: string | null;

  date_stablish?: string | null; // DateTime? @db.Date
  image_logo?: string | null;

  code_business?: string | null;
  date_of_issue?: string | null; // DateTime? @db.Date
  place_of_issue?: string | null;
  employee_quantity?: string | null;

  unit_title?: string | null;
  address?: string | null;
  short_address?: string | null;

  phone_number?: string | null;
  fax?: string | null;
  email?: string | null;
  website?: string | null;

  status?: string | null;

  parent_id?: string | null;

  organization_level?: string | null;
  number_arrange?: number | null;
  field_of_activity?: string | null;

  is_active: boolean;
  created_at: string; // DateTime
  updated_at: string; // DateTime
  description?: string | null;

  parent?: IInforCompany | null;
  childrent?: IInforCompany[];

  rankUnits?: any[];
  department?: any[];
  workLocations?: any[];
  positionPosts?: any[];
  registrationRequest?: any[];
  settingEmail?: any[];
}

export type DetailFieldType = "image" | "boolean";

export type DetailField = {
  key: string;
  label: string;
  note?: string;
  type?: DetailFieldType; 
};

export type DetailSection = {
  title: string;
  fields: DetailField[];
};

export type BussinessType = (typeof BUSSINESS_TYPE)[keyof typeof BUSSINESS_TYPE]

export type InforCompanyFormValues = {
  // AUTO (readonly)
  infor_code?: string;

  // Company
  full_name: string;
  acronym_name: string;
  business_type: BussinessType;
  tax_idennumber: string;
	  code_company: string; // company registration code

  date_stablish: string; // YYYY-MM-DD
  image_logo: string;

  // Registration
  code_business: string;
  date_of_issue: string; // YYYY-MM-DD
  place_of_issue: string;

  // Contact
  address: string;
  short_address: string;
  phone_number: string;
  fax: string;
  email: string;
  website: string;

  // Other
  status: string;
  field_of_activity: string;

  is_active: boolean;
};

export type RecruitmentActivityType =
  | "PLAN_UPDATED"
  | "POSTED_TO_BOARD"
  | "COST_ADDED";

export interface IRecruitmentActivity {
  type: RecruitmentActivityType;
  text: string;
  at?: string | null;
}

export type RecommendationScoreBreakdown = {
  final?: number | null;
  skills?: number | null;
  semantic?: number | null;
  experience?: number | null;
  position?: number | null;
  job_type?: number | null;
  location?: number | null;
  rank?: number | null;
  taxonomy_group?: number | null;
  dominant_group?: number | null;
  baseline?: number | null;
  hybrid?: number | null;
};

export type RecruitmentSkillMatch = {
  final_score?: number | null;
  skill_overlap_score?: number | null;
  group_similarity_score?: number | null;
  dominant_group_score?: number | null;
  baseline_score?: number | null;
  semantic_score?: number | null;
  hybrid_score?: number | null;
  experience_score?: number | null;
  position_score?: number | null;
  rank_score?: number | null;
  job_type_score?: number | null;
  location_score?: number | null;
  matched_skill_ids?: string[];
  missing_skill_ids?: string[];
  matched_skills?: string[];
  missing_skills?: string[];
  reason_texts?: string[];
  calculated_at?: string | null;
  pipeline_version?: string | null;
  model_name?: string | null;
  score_breakdown?: RecommendationScoreBreakdown | null;
};

export type RecruitmentSkillItem = {
  recruitment_id?: string | null;
  skill_id: string;
  level?: number | null;
  is_required?: boolean | null;
  skill?: {
    id: string;
    name: string;
    parent_id?: string | null;
    parent?: {
      id: string;
      name: string;
    } | null;
  } | null;
};

export interface IPositionPost {
  id?: string;
  name_post?: string | null;
  description_post?: string | null;
  requirements_post?: string | null;
  benefits_post?: string | null;
  benefit_more?: {
    competitive_salary?: string | null;
    professional_environment?: string | null;
    training_and_development?: string | null;
    career_opportunities?: string | null;
    allowances_and_welfare?: string | null;
  } | null;

  inforCompany?: IInforCompany | null;
  group?: IGroupJob | null;
}

export interface IRecruitmentInfor {
  id: string;

  recruitment_code?: string | null;
  internal_title?: string | null;
  post_title?: string | null;

  department_id?: string | null;
  work_location_id?: string | null;
  rank_id?: string | null;
  contact_person_id?: string | null;
  position_post_id?: string | null;
  employee_quantity?: string | null;
  type_of_job?: string | null;
  experience_type?: "none" | "exact" | "range" | "above" | "below" | "flexible" | null;
  experience_min?: number | null;
  experience_max?: number | null;
  experience_label?: string | null;
  application_deadline?: string | null; // ISO string
  salary_from?: number | null;
  salary_to?: number | null;
  salary_currency?: string | null;
  is_salary_negotiable?: boolean | null;
  total_needed?: number | null;

  // legacy content fields (keep for backward compatibility)
  job_description?: string | null;
  description?: string | null;
  candidate_requirements?: string | null;
  requirements?: string | null;
  benefits?: string | null;

  status: RecruitmentStatusType ;
  is_active: boolean;

  created_at?: string | null; // ISO string
  updated_at?: string | null; // ISO string

  // relations (optional)
  department?: IInforCompany | null;
  workLocation?: IInforCompany | null;
  rank?: any | null;
  contactPerson?: any | null;
  positionPost?: IPositionPost | null;

  recruitmentPlans?: IRecruitmentPlanParent[];
  recruitmentCosts?: IRecruitmentCosts[];
  recruitmentSkills?: RecruitmentSkillItem[];
  candidateRecruitments?: any[];

  activities?: IRecruitmentActivity[];

  total_cost?: number | null;
  cost_currency?: string | null;

  department_name?: string | null;
  work_location_name?: string | null;

  skill_match?: RecruitmentSkillMatch | null;
}

export type FormRecruitmentInforValues = {
  recruitment_code: string;
  internal_title: string;
  post_title: string;

  department_id: string;       // select -> id
  work_location_id: string;    // select -> id
  rank_id: string;             // select -> id
  contact_person_id: string;   // select -> id

  type_of_job: string;
  application_deadline: string; // "YYYY-MM-DD" (or "")

  salary_from: string; // keep as string for easier number input, convert on submit
  salary_to: string;
  salary_currency: string;

  status: RecruitmentStatusType;
  is_active: boolean;
  updated_at: string;
  created_at: string;
  // currency unit
  total_cost: number;
  cost_currency: string

}

export interface IRecruitmentPlanParent {
  id: string;
  recruitment_id?: string | null;

  total_real_number?: number | null;
  monthly_target?: string | null;      // ISO string
  expected_deadline?: string | null;   // ISO string

  recruitmentInfor?: any | null;

  recruitmentPlanChildBatches?: IRecruitmentPlanChildBatch[];
  recruitmentPlanChildPosteds?: IRecruitmentPlanChildPosted[];
}

export interface IRecruitmentPlanChildBatch {
  id: string;
  recruitment_plan_parent_id?: string | null;

  batches_title?: string | null;
  from_date?: string | null;           // ISO string
  to_date?: string | null;             // ISO string
  number_recruitment?: number | null;
  monthly_target?: string | null;      // ISO string

  recruitmentPlanParent?: any | null;
}

export interface IRecruitmentPlanChildPosted {
  id: string;
  recruitment_plan_parent_id?: string | null;

  posted_date?: string | null;         // ISO string
  expiration_date?: string | null;     // ISO string
  job_board?: string | null;

  recruitmentPlanParent?: any | null;
}

export interface IRecruitmentCosts {
  id: string;
  recruitment_id?: string | null;

  cost_type?: string | null;
  amount?: number | null;
  currency?: string | null;

  recruitmentInfor?: any | null;
}

export type FormRecruitmentPlanParentValues = {
  recruitment_id: string;
  total_real_number: string;     // input number -> convert
  monthly_target: string;        // YYYY-MM-DD
  expected_deadline: string;     // YYYY-MM-DD
}

export type FormRecruitmentPlanChildBatchValues = {
  recruitment_plan_parent_id: string;

  batches_title: string;
  from_date: string;            // YYYY-MM-DD
  to_date: string;              // YYYY-MM-DD
  number_recruitment: string;   // number input
  monthly_target: string;       // YYYY-MM-DD
}

export type FormRecruitmentPlanChildPostedValues  = {
  recruitment_plan_parent_id: string;

  posted_date: string;          // YYYY-MM-DD
  expiration_date: string;      // YYYY-MM-DD
  job_board: string;
}

export type FormRecruitmentCostsValues = {
  recruitment_id: string;
  cost_type: string;
  amount: string;     
  currency: string;
}

export type IRecInformData = IRecruitmentInfor;
export type Pagination = {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number
}

export type GetRecInfromParams = {
    pages?: number;
    limit?: number;
    search?: string;
    status?: string;
    department_id?: string;
  work_location_id?: string;
    position_post_id?: string;
    position_group_id?: string;
    exclude_id?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | string;
}

export type GetRecInformResponse = {
    data: IRecruitmentInfor[];
    pagination: Pagination
}

export interface ICompanyInfo {
  id?: string;
  full_name?: string | null;
  acronym_name?: string | null;
  image_logo?: string | null;
  address?: string | null;
  short_address?: string | null;
  field_of_activity?: string | null;
}

export interface IJobItem {
  id: string;
  recruitment_code?: string | null;
  internal_title?: string | null;
  post_title?: string | null;
  department_name?: string | null;
  work_location_name?: string | null;
  rank_name?: string | null;
  salary_from?: number | null;
  salary_to?: number | null;
  salary_currency?: string | null;
  status?: string | null;

  department?: ICompanyInfo | null;
  workLocation?: ICompanyInfo | null;
}

export const formatSalary = (
  salaryFrom?: number | null,
  salaryTo?: number | null,
  currency?: string | null
) => {                   

  const unit = currency === "USD" || currency === "EUR" ? currency : "ML VND";

  if (salaryFrom && salaryTo) {
    return `${salaryFrom} - ${salaryTo} ${unit}`;
  }

  if (salaryFrom) {
    return `From ${salaryFrom} ${unit}`;
  }

  if (salaryTo) {
    return `Up to ${salaryTo} ${unit}`;
  }

  return "Agreement";
};


export interface IGroupJob {
  id?: string;
  name_group?: string | null;
}
  export type IGroupJobData = IGroupJob;
export type PaginationJob = {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number
}

export type GetGroupJobsParams = {
    pages?: number;
    limit?: number;
    search?: string;
    status?: string;
    department_id?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | string;
}

export type GetGroupJobsResponse = {
    data: IGroupJob[];
    pagination: PaginationJob
}
