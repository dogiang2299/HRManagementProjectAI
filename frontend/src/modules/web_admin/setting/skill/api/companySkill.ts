import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_COMPANY_SKILLS } from "../../../../../constant/config";
import type { MutationConfig } from "../../../../../lib/react-query";

export const addCompanySkill = async (skillId: string) => {
  const res = await apiClient.post(URL_API_COMPANY_SKILLS, {
    skill_id: skillId,
  });
  return res.data?.data ?? res.data;
};

export const removeCompanySkill = async (skillId: string) => {
  const res = await apiClient.delete(`${URL_API_COMPANY_SKILLS}/${skillId}`);
  return res.data?.data ?? res.data;
};

type UseAddCompanySkillOptions = {
  config?: MutationConfig<typeof addCompanySkill>;
};

type UseRemoveCompanySkillOptions = {
  config?: MutationConfig<typeof removeCompanySkill>;
};

export const useAddCompanySkill = ({ config }: UseAddCompanySkillOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};

  return useMutation({
    ...restConfig,
    mutationFn: addCompanySkill,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ["company-skills"] });
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useRemoveCompanySkill = ({ config }: UseRemoveCompanySkillOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};

  return useMutation({
    ...restConfig,
    mutationFn: removeCompanySkill,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ["company-skills"] });
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
