import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import apiClient from "../../../../lib/api";

export type ApplyForJobPayload = {
  recruitment_infor_id: string;
  employee_id?: string;
  preferred_location?: string;
  cover_letter?: string;
  note?: string;
  candidate_cv_id?: string;
  cv?: File | null;
};

export type CandidateApplicationStatePayload = {
  recruitment_infor_id: string;
  employee_id?: string;
};

export type CandidateApplicationStateResponse = {
  hasApplication: boolean;
  action: "APPLY" | "UPDATE_PROFILE" | "REAPPLY" | "NONE";
  buttonLabel: string;
  canSubmit: boolean;
  application: {
    id: string;
    status: string;
    reapply_count?: number;
    applied_at?: string | null;
  } | null;
};

export type CandidateMyApplicationRecord = {
  id: string;
  status: string;
  connection_accepted?: boolean;
  note?: string | null;
  cover_letter?: string | null;
  applied_at?: string | null;
  created_at?: string;
  updated_at?: string;
  recruitment_infor?: {
    id: string;
    recruitment_code?: string | null;
    internal_title?: string | null;
    post_title?: string | null;
    salary_from?: number | null;
    salary_to?: number | null;
    salary_currency?: string | null;
    rank?: {
      name_rank?: string | null;
    } | null;
    department?: {
      id?: string;
      full_name?: string | null;
      acronym_name?: string | null;
      image_logo?: string | null;
      address?: string | null;
      short_address?: string | null;
    } | null;
    workLocation?: {
      id?: string;
      full_name?: string | null;
      acronym_name?: string | null;
      address?: string | null;
      short_address?: string | null;
    } | null;
  } | null;
};

export const applyForJob = async (payload: ApplyForJobPayload) => {
  const formData = new FormData();
  formData.append("recruitment_infor_id", payload.recruitment_infor_id);

  if (payload.employee_id) formData.append("employee_id", payload.employee_id);
  if (payload.preferred_location) formData.append("preferred_location", payload.preferred_location);
  if (payload.cover_letter) formData.append("cover_letter", payload.cover_letter);
  if (payload.note) formData.append("note", payload.note);
  if (payload.candidate_cv_id) formData.append("candidate_cv_id", payload.candidate_cv_id);
  if (payload.cv) formData.append("cv", payload.cv);

  const res = await apiClient.post("/applications/candidate/apply", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data?.data ?? res.data;
};

export const getCandidateApplicationState = async (
  payload: CandidateApplicationStatePayload,
): Promise<CandidateApplicationStateResponse> => {
  const res = await apiClient.get("/applications/candidate/state", {
    params: {
      recruitment_infor_id: payload.recruitment_infor_id,
      employee_id: payload.employee_id,
    },
  });

  return res.data?.data ?? res.data;
};

export const getMyApplications = async (status?: string): Promise<CandidateMyApplicationRecord[]> => {
  const res = await apiClient.get("/applications/candidate/me", {
    params: {
      status: status || undefined,
    },
  });

  return res.data?.data ?? res.data ?? [];
};

export const acceptContactRequest = async (applicationId: string) => {
  const res = await apiClient.patch(
    `/applications/${applicationId}/accept-contact`,
  );

  return res.data?.data ?? res.data;
};

export const declineContactRequest = async (applicationId: string) => {
  const res = await apiClient.patch(
    `/applications/${applicationId}/decline-contact`,
  );

  return res.data?.data ?? res.data;
};

export const useApplyForJob = (
  config?: Omit<UseMutationOptions<any, Error, ApplyForJobPayload>, "mutationFn">,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applyForJob,
    ...config,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["candidate-application-state"] }),
        queryClient.invalidateQueries({ queryKey: ["candidate-my-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["candidate-conversations"] }),
      ]);

      await config?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useGetCandidateApplicationState = (
  payload: CandidateApplicationStatePayload,
  config?: Omit<
    UseQueryOptions<CandidateApplicationStateResponse, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["candidate-application-state", payload],
    queryFn: () => getCandidateApplicationState(payload),
    ...config,
  });
};

export const useGetMyApplications = (
  status?: string,
  config?: Omit<UseQueryOptions<CandidateMyApplicationRecord[], Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: ["candidate-my-applications", status || "ALL"],
    queryFn: () => getMyApplications(status),
    ...config,
  });
};

export const deleteApplication = async (id: string) => {
  const res = await apiClient.delete(`/applications/${id}`);
  return res.data?.data ?? res.data;
};

export const useWithdrawApplication = (
  config?: Omit<UseMutationOptions<any, Error, string>, "mutationFn">,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteApplication(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["candidate-my-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["candidate-application-state"] }),
        queryClient.invalidateQueries({ queryKey: ["candidate-conversations"] }),
      ]);
    },
    ...config,
  });
};
