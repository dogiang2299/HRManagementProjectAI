import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_RANK } from "../../../../../constant/config";
import type { MutationConfig } from "../../../../../lib/react-query";
import type { IRank } from "../types";

export const deleteRank = async (id: string): Promise<IRank> => {
  const res = await apiClient.delete(`${URL_API_RANK}/${id}`);
  return res.data?.data ?? res.data;
};

type UseDeleteRankOptions = {
  config?: MutationConfig<typeof deleteRank>;
};

export const useDeleteRank = ({ config }: UseDeleteRankOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};

  return useMutation({
    ...restConfig,
    mutationFn: deleteRank,
    onSuccess: (data, id, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ["rank"] });
      queryClient.removeQueries({ queryKey: ["rank", id] });
      onSuccess?.(data, id, onMutateResult, context);
    },
  });
};
