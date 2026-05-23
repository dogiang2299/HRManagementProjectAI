import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_POSITION_POST } from "../../../../../constant/config";
import type { MutationConfig } from "../../../../../lib/react-query";
import type { IPositionPost } from "../types";

export type CreatePositionPostDTO = Omit<IPositionPost, "id" | "position_code" | "created_at" | "updated_at" | "inforCompany">;

export const createPositionPost = async (data: CreatePositionPostDTO): Promise<IPositionPost> => {
  const res = await apiClient.post(URL_API_POSITION_POST, data);
  return res.data?.data ?? res.data;
};

type UseCreatePositionPostOptions = {
  config?: MutationConfig<typeof createPositionPost>;
};

export const useCreatePositionPost = ({ config }: UseCreatePositionPostOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPositionPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position-post"] });
    },
    ...config,
  });
};
