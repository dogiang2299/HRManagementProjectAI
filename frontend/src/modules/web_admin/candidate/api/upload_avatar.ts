import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import  { URL_API_CANDIDATE } from "../../../../constant/config";
import apiClient from "../../../../lib/api";

type UploadAvatarVariables = {
  candidateId: string;
  file: File;
  currentAvatarFile?: string | null;
};

type UploadAvatarResponse = {
  message: string;
  avatar_file: string | null;
  avatar_url: string | null;
  avatar_uploaded_at: string | null;
};

const uploadAvatar = async ({
  candidateId,
  file,
  currentAvatarFile,
}: UploadAvatarVariables): Promise<UploadAvatarResponse> => {
  const form = new FormData();
  form.append("avatar", file);

  if (!currentAvatarFile) {
    form.append("candidate_id", candidateId);
    const res = await apiClient.post(`${URL_API_CANDIDATE}/upload-avatar`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  const res = await apiClient.put(`${URL_API_CANDIDATE}/${candidateId}/avatar`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

type UseUploadAvatarOptions = Omit<
  UseMutationOptions<UploadAvatarResponse, Error, UploadAvatarVariables>,
  "mutationFn" | "onSuccess"
> & {
  onSuccess?: (
    data: UploadAvatarResponse,
    variables: UploadAvatarVariables,
    context: unknown,
  ) => void;
};

export const useUploadCandidateAvatar = (config?: UseUploadAvatarOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};

  return useMutation({
    ...restConfig,
    mutationFn: uploadAvatar,
    onSuccess: (data, variables, _onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ["candidate"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", variables.candidateId] });
      queryClient.invalidateQueries({ queryKey: ["candidate-audit-logs", variables.candidateId] });

      onSuccess?.(data, variables, context);
    },
  });
};
