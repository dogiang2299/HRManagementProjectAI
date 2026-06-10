import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_SKILLS } from "../../../../../constant/config";
import type { TaxonomySkill } from "../types";

export type PositionSkillTreeSkill = TaxonomySkill;

export type PositionSkillTreePosition = {
  id: string;
  name: string | null;
  is_active: boolean;
  skills: PositionSkillTreeSkill[];
};

export type PositionSkillTreeGroup = {
  id: string | null;
  name: string;
  positions: PositionSkillTreePosition[];
};

export type PositionSkillTreeResponse = {
  groups: PositionSkillTreeGroup[];
};

export const getPositionSkillTree = async (params: { search?: string } = {}): Promise<PositionSkillTreeResponse> => {
  const res = await apiClient.get(`${URL_API_SKILLS}/position-skill-tree`, {
    params: {
      search: params.search?.trim() || undefined,
    },
  });

  return {
    groups: Array.isArray(res.data?.groups) ? res.data.groups : [],
  };
};

export const useGetPositionSkillTree = (params: { search?: string } = {}) => {
  return useQuery({
    queryKey: ["skills", "position-skill-tree", params],
    queryFn: () => getPositionSkillTree(params),
    placeholderData: keepPreviousData,
  });
};

export type GetSkillsForPositionResponse = {
  position: {
    id: string;
    name_post: string | null;
    group?: { id: string; name_group: string } | null;
  };
  skills: TaxonomySkill[];
};

export const getSkillsForPosition = async (positionId: string): Promise<GetSkillsForPositionResponse> => {
  const res = await apiClient.get(`${URL_API_SKILLS}/position/${positionId}/skills`);
  return res.data?.data ?? res.data;
};

export const useGetSkillsForPosition = (positionId?: string | null) => {
  return useQuery({
    queryKey: ["skills", "position-skills", positionId],
    queryFn: () => getSkillsForPosition(positionId as string),
    enabled: Boolean(positionId),
    placeholderData: keepPreviousData,
  });
};

export type AddSkillToPositionResponse = {
  position_id: string;
  skill_id: string;
  warning?: string | null;
};

export const addSkillToPosition = async (positionId: string, skill_id: string): Promise<AddSkillToPositionResponse> => {
  const res = await apiClient.post(`${URL_API_SKILLS}/position/${positionId}/skills`, { skill_id });
  return res.data?.data ?? res.data;
};

export const useAddSkillToPosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ positionId, skillId }: { positionId: string; skillId: string }) =>
      addSkillToPosition(positionId, skillId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["skills", "position-skills", variables.positionId] });
      queryClient.invalidateQueries({ queryKey: ["skills", "position-skill-tree"] });
    },
  });
};

export type RemoveSkillFromPositionResponse = {
  removed: number;
  warning?: string | null;
};

export const removeSkillFromPosition = async (positionId: string, skillId: string): Promise<RemoveSkillFromPositionResponse> => {
  const res = await apiClient.delete(`${URL_API_SKILLS}/position/${positionId}/skills/${skillId}`);
  return res.data?.data ?? res.data;
};

export const useRemoveSkillFromPosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ positionId, skillId }: { positionId: string; skillId: string }) =>
      removeSkillFromPosition(positionId, skillId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["skills", "position-skills", variables.positionId] });
      queryClient.invalidateQueries({ queryKey: ["skills", "position-skill-tree"] });
    },
  });
};

export const searchSkillsForPositionMapping = async (keyword: string, limit = 20): Promise<TaxonomySkill[]> => {
  const res = await apiClient.get(`${URL_API_SKILLS}/search`, {
    params: { keyword, limit },
  });
  const raw = res.data?.data ?? res.data;
  return Array.isArray(raw) ? raw : [];
};

export const useSearchSkillsForPositionMapping = (keyword?: string, limit = 20) => {
  const searchText = keyword?.trim() || "";
  return useQuery({
    queryKey: ["skills", "position-skill-search", searchText, limit],
    queryFn: () => searchSkillsForPositionMapping(searchText, limit),
    enabled: Boolean(searchText),
    placeholderData: keepPreviousData,
  });
};

