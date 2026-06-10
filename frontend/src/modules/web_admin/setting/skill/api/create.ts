import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_SKILLS } from "../../../../../constant/config";
import type { MutationConfig } from "../../../../../lib/react-query";
import type { ISkill, SkillTaxonomyPayload, TaxonomySkill } from "../types";

export type CreateSkillDTO = {
  name: string;
  parent_id?: string | null;
  description?: string | null;
  aliases?: string[];
  taxonomy_group?: string;
  taxonomy_subgroup?: string;
  is_active?: boolean;
  unit_id?: string | null;
};

export const createSkill = async (data: CreateSkillDTO): Promise<ISkill> => {
  const res = await apiClient.post(URL_API_SKILLS, data);
  return res.data?.data ?? res.data;
};

export const saveTaxonomySkill = async (
  data: SkillTaxonomyPayload,
): Promise<TaxonomySkill> => {
  const res = await apiClient.post(`${URL_API_SKILLS}/taxonomy`, data);
  return res.data?.data ?? res.data;
};

type UseCreateSkillOptions = {
  config?: MutationConfig<typeof createSkill>;
};

export const useCreateSkill = ({ config }: UseCreateSkillOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
    ...config,
  });
};

export const useSaveTaxonomySkill = ({ config }: { config?: MutationConfig<typeof saveTaxonomySkill> } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveTaxonomySkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
    ...config,
  });
};
