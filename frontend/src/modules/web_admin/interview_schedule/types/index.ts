// =========================
// SCHEDULE TYPE

import type { ICandidate } from "../../candidate/types";
import type { IRecruitmentInfor } from "../../recruit_inf/types";

// =========================

type ApplicationRecruitmentInfo = Pick<
  IRecruitmentInfor,
  | "id"
  | "post_title"
  | "internal_title"
  | "department_id"
  | "work_location_id"
  | "contact_person_id"
  | "department"
  | "workLocation"
  | "contactPerson"
> & {
  positionPost?: {
    id?: string;
    name_post?: string | null;
    unit_id?: string | null;
  } | null;
};

export interface IApplication {
  id: string;

  candidate_id: string;
  recruitment_infor_id: string;
  
  status: string;
  note?: string | null;
  created_at?: string | Date | null;
  recruitment_infor?: ApplicationRecruitmentInfo | null;
  candidate?: Pick<ICandidate, 'id' | 'candidate_name' | 'candidate_code' | 'phone_number' | 'email' | 'avatar_file' | 'cv_file'> | null;
}


export interface ISchedulesType {
  id: string;
  st_code?: string | null;
  type_name?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface ISchedulesTypeDetail extends ISchedulesType {
  interviewSchedules?: IInterviewSchedule[];
  typeSchedules_Links?: ITypeSchedulesLink[];
}

// =========================
// TYPE SCHEDULE LINK
// =========================
export interface ITypeSchedulesLink {
  id: string;
  tl_code?: string | null;
  type_schedule_id: string;
  exam_link?: string | null;
  is_active: boolean;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface ITypeSchedulesLinkDetail extends ITypeSchedulesLink {
  scheduleType?: ISchedulesType;
}

// =========================
// INTERVIEW SCHEDULE
// =========================
export interface IInterviewSchedule {
  id: string;
  sche_code?: string | null;
  interview_date?: string | Date | null;
  interview_location?: string | null;
  interview_room?: string | null;
  meeting_link?: string | null;
  note?: string | null;
  time_duration: number;
  times?: string | Date | null;
  type_schedule: string | null;
  is_active: boolean;
  company_id?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  company?: {
    id?: string;
    full_name?: string | null;
    acronym_name?: string | null;
  } | null;

  // ===== optional nested data if backend trả kèm =====
  candidates?: Array<{
    id?: string;
    candidate_id?: string;
    candidate?: {
      id?: string;
      candidate_name?: string | null;
      email?: string | null;
      phone_number?: string | null;
      avatar_file?: string | null;
      statusApplication?: Array<{
        id?: string;
        recruitment_infor?: {
          id?: string;
          post_title?: string | null;
          internal_title?: string | null;
          positionPost?: {
            id?: string;
            name_post?: string | null;
          } | null;
          department?: {
            id?: string;
            full_name?: string | null;
            acronym_name?: string | null;
          } | null;
          workLocation?: {
            id?: string;
            full_name?: string | null;
            acronym_name?: string | null;
          } | null;
        } | null;
      }>;
    };
  }>;

  applications?: Array<{
    id?: string;
    candidate?: {
      id?: string;
      candidate_name?: string | null;
      avatar_file?: string | null;
    } | null;
    recruitment_infor?: {
      id?: string;
      post_title?: string | null;
      internal_title?: string | null;
      positionPost?: {
        id?: string;
        name_post?: string | null;
      } | null;
      department?: {
        id?: string;
        full_name?: string | null;
        acronym_name?: string | null;
      } | null;
      workLocation?: {
        id?: string;
        full_name?: string | null;
        acronym_name?: string | null;
      } | null;
    } | null;
  }>;

  scheduleCandidates?: Array<{
    id?: string;
    candidate?: {
      id?: string;
      candidate_name?: string | null;
      avatar_file?: string | null;
      statusApplication?: Array<{
        recruitment_infor?: {
          id?: string;
          post_title?: string | null;
          internal_title?: string | null;
          positionPost?: {
            name_post?: string | null;
          } | null;
          department?: {
            full_name?: string | null;
            acronym_name?: string | null;
          } | null;
        } | null;
      }>;
    } | null;
  }>;
  
}

export interface IInterviewScheduleDetail extends IInterviewSchedule {
  scheduleType?: ISchedulesType | null;
  candidates?: ISchedulesCandidates[];
}

// =========================
// SCHEDULES CANDIDATES
// =========================
export interface ISchedulesCandidates {
  id: string;
  interview_schedule_id: string;
  candidate_id: string;
}

export interface ISchedulesCandidatesDetail extends ISchedulesCandidates {
  interviewSchedule?: IInterviewSchedule;
  candidate?: ICandidate;
}
