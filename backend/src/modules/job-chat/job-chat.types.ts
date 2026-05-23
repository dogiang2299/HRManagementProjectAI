export type ChatStep =
  | "ask_position"
  | "ask_experience"
  | "ask_skills"
  | "ask_location"
  | "ask_salary"
  | "ask_job_type"
  | "confirm"
  | "completed";

export type ChatRole = "bot" | "user";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
}

export interface ChatProfile {
  desiredPosition?: string;
  experienceText?: string;
  experienceYears?: number | null;
  skills?: string[];
  location?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  jobType?: string;
}

export interface JobChatSession {
  id: string;
  step: ChatStep;
  profile: ChatProfile;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface JobMatchResult {
  recruitmentId: string;
  score: number;
  reasons: string[];
  recruitment: any;
}

export interface ParsedChatData {
  desiredPosition?: string;
  experienceText?: string;
  experienceYears?: number | null;
  skills: string[];
  location?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  jobType?: string;
}