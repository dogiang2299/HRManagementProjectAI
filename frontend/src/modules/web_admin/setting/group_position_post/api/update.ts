import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_POSITION_GROUP } from "../../../../../constant/config";
import type { IGroupPositionPost } from "../types";

export type UpdateGroupPositionPostDTO = Partial<IGroupPositionPost>;

interface UpdateGroupPositionPostResponse {
  data: IGroupPositionPost;
  error: boolean;
  message: string;
}

const updateGroupPositionPost = async (
  id: string,
  data: UpdateGroupPositionPostDTO,
): Promise<UpdateGroupPositionPostResponse> => {
  const res = await apiClient.put(`${URL_API_POSITION_GROUP}/${id}`, data);
  return res.data;
};

type UpdateGroupPositionPostMutationOptions = Omit<
  UseMutationOptions<
    UpdateGroupPositionPostResponse,
    Error,
    { id: string; data: UpdateGroupPositionPostDTO }
  >,
  "onSuccess"
> & {
  onSuccess?: (
    data: UpdateGroupPositionPostResponse,
    variables: { id: string; data: UpdateGroupPositionPostDTO },
    context: unknown,
  ) => void;
};

export const useUpdateGroupPositionPost = (
  config?: UpdateGroupPositionPostMutationOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateGroupPositionPost(id, data),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["position-group"] });
      config?.onSuccess?.(data, variables, context);
    },
    ...config,
  });
};
