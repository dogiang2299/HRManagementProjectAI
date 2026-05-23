import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_POSITION_GROUP } from "../../../../../constant/config";
import type { MutationConfig } from "../../../../../lib/react-query";
import type { IGroupPositionPost } from "../types";

export const deleteGroupPositionPost = async (id: string): Promise<IGroupPositionPost> => {
  const res = await apiClient.delete(`${URL_API_POSITION_GROUP}/${id}`);
  return res.data?.data ?? res.data;
};

type UseDeleteGroupPositionPostOptions = {
  config?: MutationConfig<typeof deleteGroupPositionPost>;
};

export const useDeleteGroupPositionPost = ({
  config,
}: UseDeleteGroupPositionPostOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};

  return useMutation({
    ...restConfig,
    mutationFn: deleteGroupPositionPost,
    onSuccess: (data, id, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ["position-group"] });
      queryClient.removeQueries({ queryKey: ["position-group", id] });
      onSuccess?.(data, id, onMutateResult, context);
    },
  });
};
