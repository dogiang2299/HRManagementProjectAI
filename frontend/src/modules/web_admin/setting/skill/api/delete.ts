import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_SKILLS } from "../../../../../constant/config";
import type { MutationConfig } from "../../../../../lib/react-query";
import type { ISkill } from "../types";

export const deleteSkill = async (id: string): Promise<ISkill> => {
  const res = await apiClient.delete(`${URL_API_SKILLS}/${id}`);
  return res.data?.data ?? res.data;
};

type UseDeleteSkillOptions = {
  config?: MutationConfig<typeof deleteSkill>;
};

export const useDeleteSkill = ({ config }: UseDeleteSkillOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};

  return useMutation({
    ...restConfig,
    mutationFn: deleteSkill,
    onSuccess: (data, id, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      queryClient.removeQueries({ queryKey: ["skills", id] });
      onSuccess?.(data, id, onMutateResult, context);
    },
  });
};
