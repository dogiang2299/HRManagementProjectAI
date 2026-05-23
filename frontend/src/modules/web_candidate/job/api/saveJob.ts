import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import apiClient from "../../../../lib/api";
import type { IJobItem } from "../types/job";

export type ToggleSaveJobResponse = {
  saved: boolean;
  message: string;
};

export type CheckSavedJobResponse = {
  is_saved: boolean;
};

export type SavedJobRecord = {
  id: string;
  recruitment_infor_id: string;
  candidate_id: string;
  created_at?: string;
  updated_at?: string;
  recruitment_infor?: IJobItem | null;
};

export const toggleSaveJob = async (recruitmentInforId: string): Promise<ToggleSaveJobResponse> => {
  const res = await apiClient.post(`/savejob/toggle/${recruitmentInforId}`);
  return res.data?.data ?? res.data;
};

export const checkSavedJob = async (recruitmentInforId: string): Promise<CheckSavedJobResponse> => {
  const res = await apiClient.get(`/savejob/check/${recruitmentInforId}`);
  return res.data?.data ?? res.data;
};

export const getMySavedJobs = async (): Promise<SavedJobRecord[]> => {
  const res = await apiClient.get(`/savejob/me`);
  return res.data?.data ?? res.data ?? [];
};

export const useToggleSaveJob = (
  config?: Omit<UseMutationOptions<ToggleSaveJobResponse, Error, string>, "mutationFn">,
) => {
  return useMutation({
    mutationFn: toggleSaveJob,
    ...config,
  });
};

export const useCheckSavedJob = (
  recruitmentInforId: string,
  config?: Omit<UseQueryOptions<CheckSavedJobResponse, Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: ["candidate-saved-job", recruitmentInforId],
    queryFn: () => checkSavedJob(recruitmentInforId),
    enabled: Boolean(recruitmentInforId),
    ...config,
  });
};

export const useGetMySavedJobs = (
  config?: Omit<UseQueryOptions<SavedJobRecord[], Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: ["candidate-saved-jobs"],
    queryFn: getMySavedJobs,
    ...config,
  });
};
