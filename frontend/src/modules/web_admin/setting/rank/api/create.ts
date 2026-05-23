import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_RANK } from "../../../../../constant/config";
import type { MutationConfig } from "../../../../../lib/react-query";
import type { IRank } from "../types";

export type CreateRankDTO = Omit<IRank, "id" | "rank_code" | "created_at" | "updated_at" | "rankUnit">;

export const createRank = async (data: CreateRankDTO): Promise<IRank> => {
  const res = await apiClient.post(URL_API_RANK, data);
  return res.data?.data ?? res.data;
};

type UseCreateRankOptions = {
  config?: MutationConfig<typeof createRank>;
};

export const useCreateRank = ({ config }: UseCreateRankOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rank"] });
    },
    ...config,
  });
};
