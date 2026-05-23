import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_RANK } from "../../../../../constant/config";
import type { IRank } from "../types";

export type UpdateRankDTO = Partial<IRank>;

interface UpdateRankResponse {
  data: IRank;
  error: boolean;
  message: string;
}

const updateRank = async (
  id: string,
  data: UpdateRankDTO,
): Promise<UpdateRankResponse> => {
  const res = await apiClient.put(`${URL_API_RANK}/${id}`, data);
  return res.data;
};

type UpdateRankMutationOptions = Omit<
  UseMutationOptions<UpdateRankResponse, Error, { id: string; data: UpdateRankDTO }>,
  "onSuccess"
> & {
  onSuccess?: (
    data: UpdateRankResponse,
    variables: { id: string; data: UpdateRankDTO },
    context: unknown,
  ) => void;
};

export const useUpdateRank = (config?: UpdateRankMutationOptions) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateRank(id, data),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["rank"] });
      config?.onSuccess?.(data, variables, context);
    },
    ...config,
  });
};
