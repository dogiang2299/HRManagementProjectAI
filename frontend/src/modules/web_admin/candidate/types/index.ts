import type { IEmployee } from "../../employee/types";
import type { IJobCandidates } from "../../job/types";
import type { IRecruitmentInfor } from "../../recruit_inf/types";
import type { CandidateCvApplicationLink } from "../../../web_candidate/profile/api/candidateCv";

export interface ICandidate {
  id: string;

  candidate_code?: string | null;
  candidate_name: string;
  date_of_birth?: Date | null;
  gender?: string | null;
  phone_number?: string | null;
  email?: string | null;
  address?: string | null;
  country?: string | null;
  provice?: string | null;
  district?: string | null;
  date_applied?: Date | null;

  referrer_id?: string | null;

  is_active: boolean;
  is_potential: boolean;

  potential_type_id?: string | null;

  created_at?: Date | null;
  updated_at?: Date | null;

  cv_file?: string;

  cv_uploaded_at?: Date | null;

  avatar_file?: string | null;
  avatar_uploaded_at?: Date | null;

  // ===== Relations =====
  recruitment_infor?: IRecruitmentInfor | null;
  referrer?: IEmployee | null;
  potential?: {
    id: string;
    name: string;
    description?: string | null;
    is_active?: boolean;
  } | null;
  status?: string | null;
//   potential?: ISettingPotentialType | null;

  candidateExperiences?: ICandidateExperience[];
  statusApplication?: IApplycation[];
  reviewCandidate?: ICandidateReview[];
//   schedules?: ISchedulesCandidates[];
  jobCandidates?: IJobCandidates[];
  candidate_skills?: {
    skill_id: string;
    skill_name: string;
    level?: number | null;
  }[];
}

export interface ICandidateExperience {
  id?: string
  candidate_id?: string

  company_name?: string
  position?: string

  from_month?: string
  to_month?: string

  job_description?: string

  is_active?: boolean
}

export interface IApplycation {
  id: string;

  candidate_id?: string;
  recruitment_infor_id?: string;
  
  status: string;
  note?: string | null;
  cover_letter?: string | null;
  applied_at?: string | Date | null;
  reapply_count?: number | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  candidate_cv?: CandidateCvApplicationLink | null;
  candidate_cv_id?: string | null;
  recruitment_infor?: {
    id: string;
    recruitment_code?: string | null;
    post_title?: string | null;
    internal_title?: string | null;
    positionPost?: {
      id: string;
      name_post?: string | null;
    } | null;
  } | null;
  skill_match?: {
    skill_overlap_score: number;
    final_score: number;
    matched_skill_ids: string[];
    missing_skill_ids: string[];
    matched_skills: string[];
    missing_skills: string[];
  } | null;
}

export interface ICandidateReview {
  id: string;
  candidate_id: string;
  reviewer_id: string;
  rating: number | string;
  comment?: string | null;
  is_active?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
  Reviewer?: {
    id: string;
    employee_name?: string | null;
  } | null;
}

export interface ICandidateAuditLog {
  id: string;
  candidate_id: string;
  actor_employee_id?: string | null;
  actor_type?: string | null;
  actor_role?: string | null;
  action: string;
  message: string;
  metadata?: Record<string, any> | null;
  created_at: string | Date;
  actorEmployee?: {
    id: string;
    employee_name?: string | null;
  } | null;
}

export type CandidateModalMode = "add" | "edit";

export type OptionType = {
  value: string;
  label: string;
};

export type CandidateExperienceForm = {
  id?: string;
  company_name: string;
  position: string;
  from_month: string;
  to_month: string;
  job_description: string;
  is_active?: boolean;
};

export type CandidateCreateForm = {
  candidate_name: string;
  date_of_birth: string;
  gender: string;
  phone_number: string;
  email: string;
  address: string;
  country: string;
  provice: string;
  district: string;
  date_applied: string;
  referrer_id: string;
  is_active: boolean;
  is_potential: boolean;
  potential_type_id: string;
  status: string;
  cv_file: File | null;
  avatar_file: File | null;
  avatar_preview: string;
  current_avatar_file: string;
  current_cv_file: string;
  experiences: CandidateExperienceForm[];
};

export type CandidateExperiencePayload = {
  id?: string;
  company_name?: string;
  position?: string;
  from_month?: string | null;
  to_month?: string | null;
  job_description?: string;
  is_active?: boolean;
};

export type CandidateCreatePayload = {
  candidate_name?: string;
  date_of_birth?: string | null;
  gender?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  country?: string;
  provice?: string;
  district?: string;
  date_applied?: string | null;
  referrer_id?: string | null;
  is_active: boolean;
  is_potential: boolean;
  potential_type_id?: string | null;
  status?: string;
  cv_file?: File | null;
  avatar_file?: File | null;
  candidateExperiences: CandidateExperiencePayload[];
};

export type CandidateUpsertPayload = Omit<CandidateCreatePayload, "cv_file" | "avatar_file">;

export interface CandidateCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: CandidateModalMode;
  data?: ICandidate;
  onSubmit: (payload: CandidateCreatePayload) => Promise<void> | void;
  referrerOptions?: OptionType[];
  potentialTypeOptions?: OptionType[];
  forcePotential?: boolean;
  isSubmitting?: boolean;
}


export type UpdateApplicationStatusDTO = {
  status: string;
  note?: string;
};

export interface UpdateApplicationStatusResponse {
  id: string;
  status: string;
  note?: string | null;
}