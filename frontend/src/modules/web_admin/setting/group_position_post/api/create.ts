import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_POSITION_GROUP } from "../../../../../constant/config";
import type { MutationConfig } from "../../../../../lib/react-query";
import type { IGroupPositionPost } from "../types";

export type CreateGroupPositionPostDTO = Omit<
  IGroupPositionPost,
  "id" | "created_at" | "updated_at" | "positions"
>;

export const createGroupPositionPost = async (
  data: CreateGroupPositionPostDTO,
): Promise<IGroupPositionPost> => {
  const res = await apiClient.post(URL_API_POSITION_GROUP, data);
  return res.data?.data ?? res.data;
};

type UseCreateGroupPositionPostOptions = {
  config?: MutationConfig<typeof createGroupPositionPost>;
};

export const useCreateGroupPositionPost = ({
  config,
}: UseCreateGroupPositionPostOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGroupPositionPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position-group"] });
    },
    ...config,
  });
};
