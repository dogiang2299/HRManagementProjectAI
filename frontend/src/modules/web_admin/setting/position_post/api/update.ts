import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_POSITION_POST } from "../../../../../constant/config";
import type { IPositionPost } from "../types";

export type UpdatePositionPostDTO = Partial<IPositionPost>;

interface UpdatePositionPostResponse {
  data: IPositionPost;
  error: boolean;
  message: string;
}

const updatePositionPost = async (
  id: string,
  data: UpdatePositionPostDTO,
): Promise<UpdatePositionPostResponse> => {
  const res = await apiClient.put(`${URL_API_POSITION_POST}/${id}`, data);
  return res.data;
};

type UpdatePositionPostMutationOptions = Omit<
  UseMutationOptions<UpdatePositionPostResponse, Error, { id: string; data: UpdatePositionPostDTO }>,
  "onSuccess"
> & {
  onSuccess?: (
    data: UpdatePositionPostResponse,
    variables: { id: string; data: UpdatePositionPostDTO },
    context: unknown,
  ) => void;
};

export const useUpdatePositionPost = (config?: UpdatePositionPostMutationOptions) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updatePositionPost(id, data),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["position-post"] });
      config?.onSuccess?.(data, variables, context);
    },
    ...config,
  });
};
