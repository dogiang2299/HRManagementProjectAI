import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../lib/api";

export type UploadMyCvResponse = {
  message: string;
  cv_file?: string | null;
  cv_url?: string | null;
  cv_uploaded_at?: string | null;
  ai_result?: {
    rawTextLength?: number;
    detectedPositionIds?: string[];
    detectedSkillIds?: string[];
    totalExperienceMonths?: number | null;
  };
};

const uploadMyCv = async (file: File): Promise<UploadMyCvResponse> => {
  const formData = new FormData();
  formData.append("cv", file);

  const res = await apiClient.put("/candidate/me/cv", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const useUploadMyCv = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadMyCv,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["candidate-profile-me"] }),
        queryClient.invalidateQueries({ queryKey: ["recommended-jobs"] }),
      ]);
    },
  });
};