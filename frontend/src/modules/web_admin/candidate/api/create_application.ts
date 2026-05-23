import { useMutation, useQueryClient } from "@tanstack/react-query";
import { URL_API_APPLICATION } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { MutationConfig } from "../../../../lib/react-query";

type CreateApplicationInput = {
  candidate_id: string;
  recruitment_infor_id: string;
  note?: string;
};
type CreateApplicationResponse = {
  id: string;
  candidate_id: string;
  recruitment_infor_id: string;
  status: string;
  note?: string | null;
};

const createApplication = async (
  data: CreateApplicationInput,
): Promise<CreateApplicationResponse> => {
  const res = await apiClient.post(URL_API_APPLICATION, data);
  const payload = res.data?.data ?? res.data;
  const raw = payload?.data ?? payload;
  return raw as CreateApplicationResponse;
};

type UseCreateApplicationOptions = {
  config?: MutationConfig<typeof createApplication>;
};

export const useCreateApplication = ({ config }: UseCreateApplicationOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};

  return useMutation({
    ...restConfig,
    mutationFn: createApplication,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ["candidate"] });
      queryClient.invalidateQueries({ queryKey: ["application"] });
      queryClient.invalidateQueries({ queryKey: ["candidate-audit-logs", variables.candidate_id] });
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
