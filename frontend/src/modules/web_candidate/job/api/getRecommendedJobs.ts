import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import apiClient from "../../../../lib/api";

export type RecommendedCandidate = {
  id: string;
  candidate_code?: string | null;
  candidate_name?: string | null;
  desired_position_id?: string | null;
  preferred_job_type?: string | null;
};

export type GetRecommendedJobsResponse = {
  message?: string;
  candidate?: RecommendedCandidate | null;
  total_jobs_scored?: number;
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  items: RecommendedJobItem[];
};

export type RecommendedScoreBreakdown = {
  skillOverlapScore: number;
  groupSimilarityScore: number;
  dominantGroupScore: number;
  baselineScore: number;
  semanticScore: number;
  hybridScore: number;
  experienceScore: number;
  positionScore?: number;
  rankScore?: number;
  jobTypeScore?: number;
  locationScore?: number;
  finalScore: number;
};

export type RecommendationDimensionItem = {
  score: number;
  label: string;
  description: string;
};

export type RecommendedSkillAnalysis = {
  score: number;
  matchedCount: number;
  requiredCount: number;
  matchedSkills: string[];
  missingSkills: string[];
};

export type RecommendedMatchDetail = {
  overall?: {
    score: number;
    label: string;
    description: string;
  };
  dimensions?: {
    position?: RecommendationDimensionItem;
    skills?: RecommendationDimensionItem;
    semantic?: RecommendationDimensionItem;
    experience?: RecommendationDimensionItem;
  };
  skillAnalysis?: RecommendedSkillAnalysis;
  suggestions?: string[];
};

export type RecommendedJobItem = {
  recruitment_id: string;
  recruitment_code?: string | null;
  internal_title?: string | null;
  post_title?: string | null;

  company_name?: string | null;
  company_logo?: string | null;
  company_address?: string | null;
  company_short_address?: string | null;

  work_location?: {
    id?: string | null;
    name?: string | null;
    full_name?: string | null;
    address?: string | null;
    short_address?: string | null;
    map_link?: string | null;
  } | null;

  position_name?: string | null;
  group_name?: string | null;
  salary_from?: number | null;
  salary_to?: number | null;
  salary_currency?: string | null;
  is_salary_negotiable?: boolean | null;
  type_of_job?: string | null;
  rank_name?: string | null;
  experience_type?: "none" | "exact" | "range" | "above" | "below" | "flexible" | null;
  experience_min?: number | null;
  experience_max?: number | null;
  experience_label?: string | null;
  application_deadline?: string | null;

  matched_skills?: string[];
  missing_skills?: string[];
  reason_texts?: string[];

  score_breakdown: RecommendedScoreBreakdown;
  match_detail?: RecommendedMatchDetail;
};

export const getRecommendedJobs = async (
  params?: { page?: number; limit?: number; search?: string }
): Promise<GetRecommendedJobsResponse> => {
  const search = params?.search?.trim();

  const res = await apiClient.get("/recommendations/my-jobs", {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 6,
      search: search || undefined,
    },
  });

  return {
    message: res.data?.message,
    candidate: res.data?.candidate ?? null,
    total_jobs_scored: res.data?.total_jobs_scored ?? 0,
    pagination: {
      totalItems: Number(res.data?.pagination?.totalItems ?? 0),
      totalPages: Number(res.data?.pagination?.totalPages ?? 1),
      currentPage: Number(
        res.data?.pagination?.currentPage ?? params?.page ?? 1
      ),
      limit: Number(res.data?.pagination?.limit ?? params?.limit ?? 6),
    },
    items: Array.isArray(res.data?.items) ? res.data.items : [],
  };
};

export const useGetRecommendedJobs = (
  params?: { page?: number; limit?: number; search?: string },
  config?: Omit<
    UseQueryOptions<GetRecommendedJobsResponse, Error>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ["recommended-jobs", params],
    queryFn: () => getRecommendedJobs(params),
    retry: false,
    ...config,
  });
};
