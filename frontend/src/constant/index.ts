// =========================
// Employee Status
// =========================
export const EmployeeStatus = {
  Active: "Active",
  Inactive: "Inactive",
} as const;

export type EmployeeStatusKey = keyof typeof EmployeeStatus;
export type EmployeeStatusType = (typeof EmployeeStatus)[EmployeeStatusKey];

export const EMPLOYEE_STATUS_DISPLAY: Record<EmployeeStatusType, string> = {
  [EmployeeStatus.Active]: "Active",
  [EmployeeStatus.Inactive]: "Inactive",
};

// =========================
// Gender
// =========================
export const GenderEmployee = {
  Male: "Male",
  Female: "Female",
} as const;

export type GenderEmployeeKey = keyof typeof GenderEmployee;
export type GenderEmployeeType = (typeof GenderEmployee)[GenderEmployeeKey];

export const GENDER_EMPLOYEE_DISPLAY: Record<GenderEmployeeType, string> = {
  [GenderEmployee.Male]: "Male",
  [GenderEmployee.Female]: "Female",
};

// =========================
// Company Registration Request Status
// =========================
export const CompanyRegistrationStatus = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
} as const;

export type CompanyRegistrationStatusKey = keyof typeof CompanyRegistrationStatus;
export type CompanyRegistrationStatusType =
  (typeof CompanyRegistrationStatus)[CompanyRegistrationStatusKey];

export const COMPANY_REGISTRATION_STATUS_DISPLAY: Record<
  CompanyRegistrationStatusType,
  string
> = {
  [CompanyRegistrationStatus.Pending]: "Pending",
  [CompanyRegistrationStatus.Approved]: "Approved",
  [CompanyRegistrationStatus.Rejected]: "Rejected",
};

// =========================
// InforCompany Status
// =========================
export const InforCompanyStatus = {
  Active: "Active",
  Inactive: "Inactive",
} as const;

export type InforCompanyStatusKey = keyof typeof InforCompanyStatus;
export type InforCompanyStatusType = (typeof InforCompanyStatus)[InforCompanyStatusKey];

export const INFOR_COMPANY_STATUS_DISPLAY: Record<InforCompanyStatusType, string> =
  {
    [InforCompanyStatus.Active]: "Active",
    [InforCompanyStatus.Inactive]: "Inactive",
  };

// =========================
// Recruitment Status
// =========================
export const RecruitmentStatus = {
  Public: "PUBLIC",
  Internal: "INTERNAL",
  Closed: "CLOSED",
  StopReceiving: "STOP_RECEIVING",
  Draft: "DRAFT",
} as const;

export type RecruitmentStatusKey = keyof typeof RecruitmentStatus;
export type RecruitmentStatusType =
  (typeof RecruitmentStatus)[RecruitmentStatusKey];

export const RECRUITMENT_STATUS_DISPLAY: Record<
  RecruitmentStatusType,
  string
> = {
  [RecruitmentStatus.Public]: "Public",
  [RecruitmentStatus.Internal]: "Internal",
  [RecruitmentStatus.Closed]: "Closed",
  [RecruitmentStatus.StopReceiving]: "Stop Receiving",
  [RecruitmentStatus.Draft]: "Draft",
};

export const CandidateStatus = {
  Active: "Active",
  Inactive: "Inactive",
} as const;

export type CandidateStatusKey = keyof typeof CandidateStatus;
export type CandidateStatusType = (typeof CandidateStatus)[CandidateStatusKey];

export const CANDIDATE_STATUS_DISPLAY: Record<CandidateStatusType, string> = {
  [CandidateStatus.Active]: "Active",
  [CandidateStatus.Inactive]: "Inactive",
};

// ===============================
// SCHEDULE TYPE
// ===============================

export const ScheduleType = {
  InPersonInterview: "InPersonInterview", //Phỏng vấn trực tiếp
  AssessmentTest: "AssessmentTest", //Bài kiểm tra đánh giá
  ExternalOnlineInterview: "ExternalOnlineInterview", //Phỏng vấn trực tuyến qua nền tảng bên thứ ba (Zoom, Google Meet, Microsoft Teams, v.v.)
  OnlineTest: "OnlineTest", //Bài kiểm tra trực tuyến trên hệ thống của công ty
  InternshipEvaluation: "InternshipEvaluation", //Đánh giá thực tập
  InternshipAcceptance: "InternshipAcceptance", // Tiếp nhận thử việc / thực tập
} as const;

export type ScheduleTypeKey = keyof typeof ScheduleType;
export type ScheduleTypeType = (typeof ScheduleType)[ScheduleTypeKey];

export const SCHEDULE_TYPE_DISPLAY: Record<ScheduleTypeType, string> = {
  [ScheduleType.InPersonInterview]: "In-person Interview",
  [ScheduleType.AssessmentTest]: "Assessment Test",
  [ScheduleType.ExternalOnlineInterview]: "External Online Interview",
  [ScheduleType.OnlineTest]: "Online Test",
  [ScheduleType.InternshipEvaluation]: "Internship Evaluation",
  [ScheduleType.InternshipAcceptance]: "Internship Acceptance",
};


// ===============================
// STATUS CANDIDATE
// ===============================

export const APPLICATION_STATUS = {
  APPLIED: "Applied",
  CONTACTED: "Contacted",
  INTERVIEWING: "Interviewing",
  WAITING_RESPONSE: "Waiting Response",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  CLOSED: "Closed",
} as const;

export const APPLICATION_STATUS_VALUES = Object.values(APPLICATION_STATUS);

export const APPLICATION_STATUS_STEPS = [
  { value: "applied", label: "Applied" },
  { value: "contacted", label: "Contacted" },
  { value: "interviewing", label: "Interviewing" },
  { value: "waiting_response", label: "Waiting Response" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
] as const;


export const JOB_STATUS = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
} as const;

export type JobStatusType =
  (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const JOB_STATUS_VALUES = Object.values(JOB_STATUS);

export const POSITION_POST_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
} as const;

export type PositionPostStatusType =
  (typeof POSITION_POST_STATUS)[keyof typeof POSITION_POST_STATUS];

export const POSITION_POST_STATUS_VALUES = Object.values(POSITION_POST_STATUS);

export const RANK_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
} as const;

export type RankStatusType =
  (typeof RANK_STATUS)[keyof typeof RANK_STATUS];

export const RANK_STATUS_VALUES = Object.values(RANK_STATUS);

export const SKILL_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
} as const;

export type SkillStatusType =
  (typeof SKILL_STATUS)[keyof typeof SKILL_STATUS];

export const SKILL_STATUS_VALUES = Object.values(SKILL_STATUS);

export const TYPE_POTENTIAL_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
} as const;

export type TypePotentialStatusType =
  (typeof TYPE_POTENTIAL_STATUS)[keyof typeof TYPE_POTENTIAL_STATUS];

export const TYPE_POTENTIAL_STATUS_VALUES = Object.values(TYPE_POTENTIAL_STATUS);

