import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../lib/api";
import { BASE_URL } from "../../../../constant/config";

export type CandidateMyProfile = {
  id: string;
  employee_id?: string | null;
  candidate_code?: string | null;
  candidate_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  provice?: string | null;
  district?: string | null;
  desired_position_id?: string | null;
  desired_rank_id?: string | null;
  preferred_job_type?: string | null;
  desiredRank?: {
    id?: string | null;
    name_rank?: string | null;
  } | null;
  cv_file?: string | null;
  cv_uploaded_at?: string | null;
  avatar_file?: string | null;
  avatar_uploaded_at?: string | null;
  status?: string | null;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  employee?: {
    id?: string;
    employee_name?: string | null;
    email_account?: string | null;
    phone_account?: string | null;
  } | null;
};

export const getCandidateAvatarUrl = (avatarFile?: string | null) => {
  if (!avatarFile) return "";
  if (/^(https?:)?\/\//i.test(avatarFile) || avatarFile.startsWith("data:")) {
    return avatarFile;
  }

  const path = avatarFile.startsWith("/uploads/")
    ? avatarFile
    : `/uploads/avatar/${avatarFile}`;

  if (!BASE_URL) return path;

  try {
    const origin = new URL(BASE_URL).origin;
    return `${origin}${path}`;
  } catch {
    return `${BASE_URL.replace(/\/$/, "")}${path}`;
  }
};

export const getMyCandidateProfile = async (): Promise<CandidateMyProfile> => {
  const res = await apiClient.get("/candidate/me");
  return res.data?.data ?? res.data;
};

export const useGetMyCandidateProfile = () => {
  return useQuery({
    queryKey: ["candidate-profile-me"],
    queryFn: getMyCandidateProfile,
  });
};

export const uploadMyCv = async (file: File) => {
  const formData = new FormData();
  formData.append("cv", file);

  const res = await apiClient.put("/candidate/me/cv", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data?.data ?? res.data;
};

export const updateCandidateProfile = async (
  candidateId: string,
  data: { candidate_name?: string; phone_number?: string }
) => {
  const res = await apiClient.put(`/candidate/${candidateId}`, data);
  return res.data?.data ?? res.data;
};

export const updateMyCandidateBasicInfo = async (data: {
  candidate_name?: string | null;
  phone_number?: string | null;
}) => {
  const res = await apiClient.patch("/candidate/me/basic-info", data);
  return res.data?.data ?? res.data;
};

export const uploadMyAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await apiClient.put("/candidate/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data?.data ?? res.data;
};

export const useUploadMyCv = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadMyCv(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-profile-me"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-cv-list"] });
      queryClient.invalidateQueries({ queryKey: ["recommended-jobs"] });
    },
  });
};

export const useUpdateCandidateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      candidateId,
      data,
    }: {
      candidateId: string;
      data: { candidate_name?: string; phone_number?: string };
    }) => updateCandidateProfile(candidateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-profile-me"] });
    },
  });
};

export const useUpdateMyCandidateBasicInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMyCandidateBasicInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-profile-me"] });
    },
  });
};

export const useUploadMyAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadMyAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-profile-me"] });
    },
  });
};
