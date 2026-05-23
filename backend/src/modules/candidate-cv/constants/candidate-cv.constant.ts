export const CANDIDATE_CV_SOURCE_TYPE = {
  UPLOADED_FILE: "UPLOADED_FILE",
  AI_GENERATED: "AI_GENERATED",
} as const;

export const CANDIDATE_CV_STATUS = {
  DRAFT: "DRAFT",
  COMPLETED: "COMPLETED",
  ARCHIVED: "ARCHIVED",
} as const;

export type CandidateCvSourceType =
  (typeof CANDIDATE_CV_SOURCE_TYPE)[keyof typeof CANDIDATE_CV_SOURCE_TYPE];
export type CandidateCvStatus =
  (typeof CANDIDATE_CV_STATUS)[keyof typeof CANDIDATE_CV_STATUS];

export const EMPTY_CV_STRUCTURED_DATA = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    position: "",
  },
  summary: "",
  skills: [],
  experience: [
    {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  ],
  education: [
    {
      school: "",
      major: "",
      startDate: "",
      endDate: "",
    },
  ],
  projects: [
    {
      name: "",
      description: "",
      technologies: [],
    },
  ],
  certificates: [],
  languages: [],
};
