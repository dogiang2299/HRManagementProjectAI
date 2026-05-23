import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_POSITION_POST } from "../../../../../constant/config";
import type { MutationConfig } from "../../../../../lib/react-query";
import type { IPositionPost } from "../types";

export const deletePositionPost = async (id: string): Promise<IPositionPost> => {
  const res = await apiClient.delete(`${URL_API_POSITION_POST}/${id}`);
  return res.data?.data ?? res.data;
};

type UseDeletePositionPostOptions = {
  config?: MutationConfig<typeof deletePositionPost>;
};

export const useDeletePositionPost = ({ config }: UseDeletePositionPostOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};
  return useMutation({
    ...restConfig,
    mutationFn: deletePositionPost,
    onSuccess: (data, id, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ["position-post"] });
      queryClient.removeQueries({ queryKey: ["position-post", id] });
      onSuccess?.(data, id, onMutateResult, context);
    },
  });
};
