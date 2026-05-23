import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import  { URL_API_CANDIDATE } from "../../../../constant/config";
import apiClient from "../../../../lib/api";

type UploadCvVariables = {
  candidateId: string;
  file: File;
  // cv_file hiện tại của candidate (null/undefined => chưa có CV)
  currentCvFile?: string | null;
};

type UploadCvResponse = {
  message: string;
  cv_file: string | null;
  cv_url: string | null;
  cv_uploaded_at: string | null;
};

const uploadCv = async ({
  candidateId,
  file,
  currentCvFile,
}: UploadCvVariables): Promise<UploadCvResponse> => {
  const form = new FormData();
  form.append("cv", file);

  // ✅ chưa có cv => POST
  if (!currentCvFile) {
    form.append("candidate_id", candidateId);
    const res = await apiClient.post(`${URL_API_CANDIDATE}/upload-cv`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  // ✅ có cv rồi => PUT replace
  const res = await apiClient.put(`${URL_API_CANDIDATE}/${candidateId}/cv`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

type UseUploadCvOptions = Omit<
  UseMutationOptions<UploadCvResponse, Error, UploadCvVariables>,
  "mutationFn" | "onSuccess"
> & {
  onSuccess?: (
    data: UploadCvResponse,
    variables: UploadCvVariables,
    context: unknown
  ) => void;
};

export const useUploadCandidateCv = (config?: UseUploadCvOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};

  return useMutation({
    ...restConfig,
    mutationFn: uploadCv,
    onSuccess: (data, variables, _onMutateResult, context) => {
      // refresh list + detail
      queryClient.invalidateQueries({ queryKey: ["candidate"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", variables.candidateId] });
      queryClient.invalidateQueries({ queryKey: ["candidate-audit-logs", variables.candidateId] });

      onSuccess?.(data, variables, context);
    },
  });
};