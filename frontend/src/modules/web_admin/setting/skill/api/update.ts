import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_SKILLS } from "../../../../../constant/config";
import type { ISkill, SkillTaxonomyPayload, TaxonomySkill } from "../types";

export type UpdateSkillDTO = {
  name?: string;
  parent_id?: string | null;
  description?: string | null;
  aliases?: string[];
  taxonomy_group?: string;
  taxonomy_subgroup?: string;
  is_active?: boolean;
  unit_id?: string | null;
};

const updateSkill = async (
  id: string,
  data: UpdateSkillDTO,
): Promise<ISkill> => {
  const res = await apiClient.put(`${URL_API_SKILLS}/${id}`, data);
  return res.data?.data ?? res.data;
};

export const updateTaxonomySkill = async (
  id: string,
  data: SkillTaxonomyPayload,
): Promise<TaxonomySkill> => {
  const res = await apiClient.put(`${URL_API_SKILLS}/taxonomy/${id}`, data);
  return res.data?.data ?? res.data;
};

type UpdateSkillMutationOptions = Omit<
  UseMutationOptions<ISkill, Error, { id: string; data: UpdateSkillDTO }>,
  "onSuccess"
> & {
  onSuccess?: (
    data: ISkill,
    variables: { id: string; data: UpdateSkillDTO },
    context: unknown,
  ) => void;
};

export const useUpdateSkill = (config?: UpdateSkillMutationOptions) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateSkill(id, data),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      config?.onSuccess?.(data, variables, context);
    },
    ...config,
  });
};

type UpdateTaxonomySkillMutationOptions = Omit<
  UseMutationOptions<TaxonomySkill, Error, { id: string; data: SkillTaxonomyPayload }>,
  "onSuccess"
> & {
  onSuccess?: (
    data: TaxonomySkill,
    variables: { id: string; data: SkillTaxonomyPayload },
    context: unknown,
  ) => void;
};

export const useUpdateTaxonomySkill = (config?: UpdateTaxonomySkillMutationOptions) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTaxonomySkill(id, data),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      config?.onSuccess?.(data, variables, context);
    },
    ...config,
  });
};
