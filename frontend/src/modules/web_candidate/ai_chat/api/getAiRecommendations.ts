import { useQuery } from "@tanstack/react-query";
import apiClient from "../../../../lib/api";

export type AiRecommendationItem = {
  rank: number;
  hybrid_score: number | null;
  semantic_similarity: number | null;
  skill_overlap_score: number | null;
  group_similarity_score: number | null;
  dominant_group_score: number | null;
  explanation_short: string | null;
  explanation_long: string | null;
  ui_badges: string[];
  recruitment_infor: {
    id: string;
    recruitment_code?: string | null;
    internal_title?: string | null;
    post_title?: string | null;
    type_of_job?: string | null;
    application_deadline?: string | null;
    salary_from?: number | null;
    salary_to?: number | null;
    salary_currency?: string | null;
    total_needed?: number | null;
    status?: string | null;
    position_post?: {
      id: string;
      position_code?: string | null;
      name_post?: string | null;
      group?: {
        id: string;
        name_group?: string | null;
        slug?: string | null;
      } | null;
    } | null;
    rank_info?: {
      id: string;
      rank_code?: string | null;
      name_rank?: string | null;
    } | null;
    company?: {
      id: string;
      full_name?: string | null;
      acronym_name?: string | null;
      image_logo?: string | null;
      website?: string | null;
      address?: string | null;
      short_address?: string | null;
      phone_number?: string | null;
      email?: string | null;
    } | null;
    work_location?: {
      id: string;
      full_name?: string | null;
      address?: string | null;
      short_address?: string | null;
      map_link?: string | null;
    } | null;
  };
};

export type AiRecommendationResponse = {
  candidate: {
    id: string;
    candidate_code?: string | null;
    candidate_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
  };
  total: number;
  items: AiRecommendationItem[];
  message?: string;
};

const getAiRecommendations = async () => {
  const { data } = await apiClient.get<AiRecommendationResponse>("/recommendations/my-jobs");
  return data;
};

export const useAiRecommendations = (enabled = true) => {
  return useQuery({
    queryKey: ["candidate-ai-recommendations"],
    queryFn: getAiRecommendations,
    enabled,
    staleTime: 1000 * 60 * 5,
  });
};
