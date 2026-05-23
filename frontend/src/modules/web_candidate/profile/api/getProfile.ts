import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../lib/api";
import publicApiClient from "../../../../lib/public-api";

export type CareerOptionItem = {
  id: string;
  name: string;
};

export type CareerOptions = {
  positions: CareerOptionItem[];
  ranks: CareerOptionItem[];
  jobTypes: string[];
};

export type UpdateMyCareerPreferencesPayload = {
  desired_rank_id?: string | null;
  preferred_job_type?: string | null;
  provice?: string | null;
  district?: string | null;
  address?: string | null;
};

export const getCareerOptions = async (): Promise<CareerOptions> => {
  const res = await publicApiClient.get("/candidate/career-options");
  return res.data?.data ?? res.data;
};

export const useGetCareerOptions = () => {
  return useQuery({
    queryKey: ["candidate-career-options"],
    queryFn: getCareerOptions,
  });
};

export const updateMyCareerPreferences = async (
  payload: UpdateMyCareerPreferencesPayload,
) => {
  const res = await apiClient.patch("/candidate/me/career-preferences", payload);
  return res.data?.data ?? res.data;
};

export const useUpdateMyCareerPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateMyCareerPreferencesPayload) =>
      updateMyCareerPreferences(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-profile-me"] });
    },
  });
};
